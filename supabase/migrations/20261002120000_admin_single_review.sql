begin;

-- Pilot decision (2026-10-02): the ministry has a single administrator with the
-- maturity to review and approve published content. An administrator may now be
-- both author and reviewer. Leaders still cannot approve their own content, and
-- a self-reviewed version still requires the explicit approve and publish steps,
-- both audited.
alter table public.learning_publications drop constraint if exists learning_publications_check;

create or replace function public.learning_command(target_ministry uuid, command text, target_id uuid default null, payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v public.learning_versions; p public.learning_publications; e public.learning_enrollments;
  staff boolean; admin boolean; sid uuid; author uuid; reviewer uuid; next_state text;
  event_name text; q jsonb; choice jsonb; answers jsonb; correct_count integer := 0;
  question_count integer; feedback jsonb := '[]'; outcome jsonb := '{}'; prior public.learning_quiz_attempts;
  request_uuid uuid; reading_id text; note text; required_readings text[]; passed boolean;
begin
  if auth.uid() is null or not public.is_own_ministry(target_ministry) then raise exception 'learning_access_denied'; end if;
  if payload is null or jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 8192 then raise exception 'learning_invalid_input'; end if;
  staff := public.has_ministry_role(target_ministry, array['leader','admin']::public.member_role[]);
  admin := public.has_ministry_role(target_ministry, array['admin']::public.member_role[]);
  select * into v from public.learning_versions where world_slug = 'voce-faz-parte' and version = 1;
  if not found then raise exception 'learning_not_installed'; end if;

  if command = 'configure' then
    if not admin then raise exception 'learning_access_denied'; end if;
    author := (payload->>'author')::uuid; reviewer := (payload->>'reviewer')::uuid;
    -- Distinct editors must both be active staff; a single editor (author =
    -- reviewer) must be an active administrator.
    if author is null or reviewer is null or
      (author <> reviewer and (select count(*) from public.ministry_members where ministry_id = target_ministry and is_active
       and role in ('leader','admin') and profile_id in (author, reviewer)) <> 2) or
      (author = reviewer and not exists(select 1 from public.ministry_members where ministry_id = target_ministry and is_active
       and role = 'admin' and profile_id = author)) then raise exception 'learning_invalid_editors'; end if;
    insert into public.learning_publications(ministry_id,version_id,author_id,reviewer_id)
      values(target_ministry,v.id,author,reviewer) on conflict(ministry_id,version_id) do nothing;
    select * into p from public.learning_publications where ministry_id = target_ministry and version_id = v.id for update;
    if p.state <> 'draft' then raise exception 'learning_invalid_transition'; end if;
    update public.learning_publications set author_id = author, reviewer_id = reviewer where id = p.id returning * into p;
  else
    -- A publication lock serializes transitions with learner writes. Enrollment
    -- lock plus unique ledger keys also protects retries/concurrent requests.
    select * into p from public.learning_publications where ministry_id = target_ministry and version_id = v.id for update;
    if not found then raise exception 'learning_unavailable'; end if;
    if command in ('submit_review','approve','reject','recall','publish','archive') then
      if not staff then raise exception 'learning_access_denied'; end if;
      if command = 'submit_review' and p.state = 'draft' and p.author_id = auth.uid() then next_state := 'in_review';
      elsif command = 'approve' and p.state = 'in_review' and p.reviewer_id = auth.uid() and (p.author_id <> auth.uid() or admin)
        and payload->>'confirmed' = 'true' then next_state := 'approved';
      elsif command = 'reject' and p.state = 'in_review' and p.reviewer_id = auth.uid()
        and char_length(btrim(coalesce(payload->>'note',''))) between 10 and 300 then next_state := 'draft';
      -- Admin escape hatch when the assigned reviewer becomes unavailable: the
      -- version returns to draft for reassignment; it never approves or publishes.
      elsif command = 'recall' and p.state in ('in_review','approved') and admin
        and char_length(btrim(coalesce(payload->>'note',''))) between 10 and 300 then next_state := 'draft';
      elsif command = 'publish' and p.state = 'approved' and admin and payload->>'confirmed' = 'true'
        and p.approved_by = p.reviewer_id
        and exists(select 1 from public.ministry_members where ministry_id = target_ministry and profile_id = p.reviewer_id
          and is_active and (role = 'admin' or (role = 'leader' and p.author_id <> p.reviewer_id))) then next_state := 'published';
      elsif command = 'archive' and p.state = 'published' and admin then next_state := 'archived';
      else raise exception 'learning_invalid_transition'; end if;
      update public.learning_publications set state = next_state,
        review_note = case when command in ('reject','recall') then btrim(payload->>'note') else review_note end,
        approved_by = case when next_state = 'approved' then auth.uid() when next_state = 'draft' then null else approved_by end,
        approved_at = case when next_state = 'approved' then now() when next_state = 'draft' then null else approved_at end,
        published_at = case when next_state = 'published' then now() else published_at end where id = p.id;
    elsif command = 'enroll' then
      if not admin or p.state <> 'published' or payload->>'confirmed' is distinct from 'true' then raise exception 'learning_access_denied'; end if;
      select s.id into sid from public.students s where s.id = target_id and s.ministry_id = target_ministry
        and s.is_active and s.status <> 'archived' and exists(select 1 from public.ministry_members mm
          where mm.ministry_id = target_ministry and mm.profile_id = s.auth_user_id and mm.role = 'student' and mm.is_active);
      if sid is null then raise exception 'learning_invalid_student'; end if;
      insert into public.learning_enrollments(publication_id,student_id,enrolled_by) values(p.id,sid,auth.uid())
        on conflict(publication_id,student_id) do update set is_active = true, enrolled_by = auth.uid(), updated_at = now();
    else
      select * into e from public.learning_enrollments where id = target_id and publication_id = p.id for update;
      if not found then raise exception 'learning_access_denied'; end if;
      if command = 'withdraw' then
        if not admin then raise exception 'learning_access_denied'; end if;
        update public.learning_enrollments set is_active = false, updated_at = now() where id = e.id;
      else
        if p.state <> 'published' or not e.is_active then raise exception 'learning_unavailable'; end if;
        if not exists(select 1 from public.students s join public.ministry_members mm
          on mm.profile_id = s.auth_user_id and mm.ministry_id = s.ministry_id
          where s.id = e.student_id and s.ministry_id = target_ministry and s.is_active and s.status <> 'archived'
          and mm.is_active and mm.role = 'student') then raise exception 'learning_access_denied'; end if;
        if command = 'review_practice' then
          note := btrim(coalesce(payload->>'note',''));
          if not staff or e.practice_state <> 'pending' or not e.summary_done then raise exception 'learning_access_denied'; end if;
          if char_length(note) not between 10 and 300 or coalesce(payload->>'decision','') not in ('approved','changes_requested')
            or coalesce(payload->>'mode','') not in ('supervised','equivalent') then raise exception 'learning_invalid_input'; end if;
          update public.learning_enrollments set practice_state = payload->>'decision', practice_mode = payload->>'mode',
            review_note = note, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now() where id = e.id;
          insert into public.learning_activity_reviews(enrollment_id,reviewer_id,decision,mode,note)
            values(e.id,auth.uid(),payload->>'decision',payload->>'mode',note);
          if payload->>'decision' = 'approved' then event_name := 'practice'; end if;
        else
          if not public.has_ministry_role(target_ministry,array['student']::public.member_role[]) or not exists(
            select 1 from public.students where id = e.student_id and auth_user_id = auth.uid()) then raise exception 'learning_access_denied'; end if;
          select array_agg(card->>'id') into required_readings from jsonb_array_elements(v.content->'cards') card;
          if command = 'reading' then
            reading_id := payload->>'reading';
            if reading_id is null or not reading_id = any(required_readings) then raise exception 'learning_invalid_input'; end if;
            update public.learning_enrollments set readings = case when reading_id = any(readings) then readings else array_append(readings,reading_id) end,
              updated_at = now() where id = e.id returning * into e;
            if e.readings @> required_readings then event_name := 'reading'; end if;
          elsif command = 'exercise' then
            if not e.readings @> required_readings then raise exception 'learning_prerequisite'; end if;
            choice := payload->'answer';
            if choice is null or not exists(select 1 from generate_series(0,jsonb_array_length(v.content#>'{exercise,options}')-1) n
              where to_jsonb(n) = choice) then raise exception 'learning_invalid_input'; end if;
            passed := choice = v.content#>'{exercise,correct}';
            outcome := jsonb_build_object('correct',passed,'explanation',v.content#>>'{exercise,explanation}');
            if passed then update public.learning_enrollments set exercise_done = true, updated_at = now() where id = e.id; event_name := 'exercise'; end if;
          elsif command in ('save_draft','quiz') then
            if not e.exercise_done or not e.readings @> required_readings then raise exception 'learning_prerequisite'; end if;
            answers := payload->'answers';
            if answers is null or jsonb_typeof(answers) <> 'object' then raise exception 'learning_invalid_input'; end if;
            if exists(select 1 from jsonb_object_keys(answers) k where not exists(
              select 1 from jsonb_array_elements(v.content->'questions') item where item->>'id' = k)) then raise exception 'learning_invalid_input'; end if;
            for q in select * from jsonb_array_elements(v.content->'questions') loop
              choice := answers->(q->>'id');
              if choice is not null and not exists(select 1 from generate_series(0,jsonb_array_length(q->'options')-1) n
                where to_jsonb(n) = choice) then raise exception 'learning_invalid_input'; end if;
              if command = 'quiz' and choice is null then raise exception 'learning_incomplete_quiz'; end if;
              if choice = q->'correct' then correct_count := correct_count + 1; end if;
              feedback := feedback || jsonb_build_array(jsonb_build_object('id',q->>'id','correct',choice = q->'correct','explanation',q->>'explanation'));
            end loop;
            if command = 'save_draft' then
              update public.learning_enrollments set quiz_draft = answers, updated_at = now() where id = e.id;
            else
              request_uuid := (payload->>'requestId')::uuid;
              if request_uuid is null then raise exception 'learning_invalid_input'; end if;
              select * into prior from public.learning_quiz_attempts where enrollment_id = e.id and request_id = request_uuid;
              if found then
                if prior.answers <> answers then raise exception 'learning_request_conflict'; end if;
                return prior.result;
              end if;
              if (select count(*) from public.learning_quiz_attempts where enrollment_id = e.id and created_at > now() - interval '1 minute') >= 12
                then raise exception 'learning_rate_limit'; end if;
              question_count := jsonb_array_length(v.content->'questions');
              passed := correct_count * 100 >= question_count * (v.content#>>'{rules,passingPercent}')::integer;
              outcome := jsonb_build_object('passed',passed,'correctCount',correct_count,'total',question_count,'feedback',feedback);
              insert into public.learning_quiz_attempts(enrollment_id,request_id,answers,result) values(e.id,request_uuid,answers,outcome);
              update public.learning_enrollments set quiz_passed = quiz_passed or passed, quiz_draft = answers, updated_at = now() where id = e.id;
              if passed then event_name := 'quiz'; end if;
            end if;
          elsif command = 'summary' then
            if not e.quiz_passed or not e.exercise_done or not e.readings @> required_readings then raise exception 'learning_prerequisite'; end if;
            update public.learning_enrollments set summary_done = true, updated_at = now() where id = e.id; event_name := 'summary';
          elsif command = 'request_practice' then
            if not e.summary_done then raise exception 'learning_prerequisite'; end if;
            if e.practice_state in ('not_requested','changes_requested') then
              update public.learning_enrollments set practice_state = 'pending', updated_at = now() where id = e.id;
            end if;
          else raise exception 'learning_invalid_input'; end if;
        end if;
        if event_name is not null then
          insert into public.learning_xp_ledger(enrollment_id,event,amount)
            values(e.id,event_name,(v.content#>>array['rules','xp',event_name])::integer)
            on conflict(enrollment_id,event) do nothing;
        end if;
        -- The private badge is represented by this immutable completion timestamp
        -- and the enrolled content version's achievement label, never by XP.
        update public.learning_enrollments set completed_at = now() where id = e.id
          and completed_at is null and summary_done and quiz_passed and exercise_done and practice_state = 'approved';
      end if;
    end if;
  end if;
  if command in ('configure','submit_review','approve','reject','recall','publish','archive','enroll','withdraw','review_practice') then
    insert into public.audit_logs(ministry_id,actor_id,action,entity_type,entity_id,metadata)
      values(target_ministry,auth.uid(),'learning_'||command,'learning_publications',p.id,
        jsonb_build_object('target_id',target_id,'version_id',v.id,'author_id',p.author_id,'reviewer_id',p.reviewer_id,
          'decision',payload->>'decision','mode',payload->>'mode','confirmed',payload->'confirmed',
          'editorial_note',case when command in ('reject','recall') then payload->>'note' else null end));
  end if;
  return outcome;
end; $$;

commit;
