-- World one, version 2 (2026-10-02 pedagogical/game review): key verse,
-- Holy Spirit in 1 Corinthians 12, Ephesians 4:29, simpler language, a recurring
-- character, per-reading checkpoints and rebalanced XP (still 220 in total).
-- Source: content/fundamentos/voce-faz-parte.v2.json. Version 1 stays immutable.
-- The RPCs now serve the newest version of the world: deploying a later version
-- starts a new draft publication, so archive a live version before shipping one.
begin;
insert into public.learning_versions(world_slug,version,content) values
('voce-faz-parte',2,$content${
  "slug": "voce-faz-parte",
  "version": 2,
  "ruleVersion": "fundamentos-2",
  "title": "Você faz parte!",
  "objective": "Entender que acolhemos porque Cristo nos acolheu primeiro e escolher formas de receber as pessoas com respeito, sem expor ninguém.",
  "centralIdea": "Cristo nos recebeu; por isso, recebemos uns aos outros com respeito.",
  "hook": "Já chegou num lugar e achou que ninguém ia perceber se você sumisse?",
  "audience": "12–14 anos",
  "estimatedMinutes": "5–7 minutos de leitura, além das atividades; estimativa a validar no piloto",
  "references": [
    "Romanos 15:7",
    "Salmo 139:1–6",
    "Marcos 10:13–16",
    "1 Coríntios 12:11–27",
    "Efésios 4:29"
  ],
  "sourceNote": "Explicações originais a partir das referências bíblicas. O versículo-chave é citado da Almeida Revista e Corrigida (ARC); leia os demais trechos na sua Bíblia. Conteúdo preparado com auxílio de IA, sujeito à revisão registrada antes da publicação.",
  "keyVerse": {
    "reference": "Romanos 15:7",
    "text": "Portanto, recebei-vos uns aos outros, como também Cristo nos recebeu para glória de Deus.",
    "translation": "ARC",
    "mission": "Procure Romanos 15:7 na sua Bíblia e tente guardar este versículo de cor. Ele é a razão de tudo neste mundo: acolhemos porque Cristo nos acolheu primeiro."
  },
  "cards": [
    {
      "id": "conhecido",
      "title": "1. Deus conhece pessoas, não números",
      "reference": "Salmo 139:1–6",
      "visual": "known",
      "scene": "Primeiro domingo do Lucas no grupo. Ele chega, olha em volta e pensa: será que alguém vai perceber que eu estou aqui?",
      "idea": "Deus não te vê como um número na chamada. Ele te conhece de verdade, e isso não depende de você contar tudo para o grupo.",
      "paragraphs": [
        "O Lucas acabou de chegar. Todo mundo parece se conhecer, e ele não sabe onde sentar. Talvez você já tenha sentido isso: chegar num lugar e achar que ninguém vai notar se você sumir.",
        "No Salmo 139, Davi ora a Deus admirado: o Senhor sabe quando ele senta e quando levanta, conhece os seus caminhos e até os seus pensamentos. Ninguém passa despercebido diante de Deus. O salmo não promete que nunca vamos nos sentir sozinhos, mas mostra que, mesmo nesses momentos, Deus nos conhece.",
        "Se Deus conhece cada pessoa pelo nome, o grupo também pode prestar atenção em quem chega. Só que conhecer alguém é diferente de exigir que ele conte tudo. Você pode dizer como gosta de ser chamado e guardar o que é pessoal. Ser cuidado não depende de se expor."
      ],
      "checkpoint": {
        "id": "conhecido-check",
        "prompt": "Segundo o Salmo 139, como Deus conhece Davi?",
        "options": [
          "Só pelo que ele faz na igreja.",
          "Profundamente: quando senta, quando levanta e até o que pensa.",
          "Só depois que Davi conta tudo para alguém."
        ],
        "correct": 1,
        "explanation": "Davi se admira porque Deus o conhece por completo, no dia a dia, e não apenas pela aparência."
      }
    },
    {
      "id": "acolhido",
      "title": "2. Jesus não deixou ninguém do lado de fora",
      "reference": "Marcos 10:13–16",
      "visual": "welcome",
      "scene": "O Lucas entra calado. Um colega já pensa em chamar a atenção de todo mundo para ele. Será que esse é o melhor jeito de acolher?",
      "idea": "Quando quiseram afastar as crianças, Jesus se indignou e as recebeu nos braços. Acolher é aproximar com respeito, não colocar holofote.",
      "paragraphs": [
        "Em Marcos 10, algumas pessoas levam crianças até Jesus, e os discípulos tentam impedir. Naquela época, crianças eram vistas como pouco importantes. Jesus se indignou com os discípulos, mandou deixarem as crianças virem a Ele, tomou-as nos braços e as abençoou.",
        "A lição vai além da idade: Jesus abre espaço justamente para quem os outros acham que não importa. Ninguém precisa saber todas as músicas, falar bonito em público ou acertar todas as respostas para ser bem recebido.",
        "Acolher não é colocar alguém no centro das atenções sem perguntar. Um convite simples já ajuda: “Quer sentar com a gente?”. Se a pessoa disser que não, respeite e deixe a porta aberta. E ninguém precisa tirar foto nem postar o nome de quem chegou para provar que acolheu."
      ],
      "checkpoint": {
        "id": "acolhido-check",
        "prompt": "Como Jesus reagiu quando os discípulos tentaram impedir as crianças?",
        "options": [
          "Concordou e pediu que esperassem do lado de fora.",
          "Pediu que voltassem quando fossem adultas.",
          "Indignou-se com os discípulos e recebeu as crianças."
        ],
        "correct": 2,
        "explanation": "Jesus se indignou com quem impedia e recebeu as crianças nos braços. Ele abre espaço para quem os outros deixam de lado."
      }
    },
    {
      "id": "muitos-membros",
      "title": "3. Um só corpo, unido pelo Espírito",
      "reference": "1 Coríntios 12:11–27",
      "visual": "body",
      "scene": "No grupo tem gente que fala muito, gente que observa, gente que ajuda em silêncio. E agora tem o Lucas, que ainda está aprendendo.",
      "idea": "O Espírito Santo une a Igreja como um só corpo e distribui os dons como quer. Ninguém sobra: um precisa do outro.",
      "paragraphs": [
        "Paulo compara a Igreja a um corpo. Olho, mão e pé são diferentes, mas fazem parte do mesmo corpo. Ele explica que todos nós fomos batizados em um mesmo Espírito para formar um só corpo (versículo 13). Quem une a Igreja não é o fato de todos serem iguais: é o Espírito Santo.",
        "No mesmo capítulo, Paulo ensina que é o Espírito quem distribui os dons, a cada um como Ele quer (versículo 11). Por isso, ninguém pode dizer “você não faz falta”, e ninguém precisa competir para aparecer mais. Um precisa do outro.",
        "No nosso grupo, isso aparece em atitudes simples: explicar a atividade para quem não entendeu, dividir as tarefas de forma justa e ouvir ideias diferentes. Às vezes, uma ajuda discreta é o que permite que outra pessoa participe tranquila."
      ],
      "checkpoint": {
        "id": "muitos-membros-check",
        "prompt": "Segundo Paulo, quem une a Igreja como um só corpo?",
        "options": [
          "O Espírito Santo, que também distribui os dons.",
          "Quem participa da igreja há mais tempo.",
          "Quem tem mais talento para aparecer."
        ],
        "correct": 0,
        "explanation": "Em 1 Coríntios 12, Paulo ensina que fomos batizados em um mesmo Espírito para formar um só corpo, e que é o Espírito quem distribui os dons."
      }
    },
    {
      "id": "respeito",
      "title": "4. Palavras que constroem",
      "reference": "Efésios 4:29",
      "visual": "limits",
      "scene": "Alguém do grupo começa a chamar o Lucas por um apelido de que ele não gosta. Todo mundo ri. E agora?",
      "idea": "A Bíblia pede palavras que edificam, não que humilham. Respeitar os limites do outro também é cuidar.",
      "paragraphs": [
        "Em Efésios 4:29, Paulo pede que nenhuma palavra ruim saia da nossa boca, só palavras boas, que edificam e fazem bem a quem ouve. Apelido que ofende, piada que humilha e pressão para alguém contar segredos não combinam com essa orientação.",
        "Fazer parte do grupo não significa aceitar tudo. Você pode pedir que parem uma brincadeira, recusar uma foto ou preferir só observar uma atividade. E, se alguém pedir para parar, o certo é parar.",
        "Se a humilhação, a ameaça ou a insistência continuarem, converse com um adulto da liderança ou da sua família. Pedir ajuda não é dedurar nem estragar a amizade: é proteger. E dá para apoiar quem foi desrespeitado sem espalhar a história no grupo de mensagens."
      ],
      "checkpoint": {
        "id": "respeito-check",
        "prompt": "O que Efésios 4:29 pede sobre as nossas palavras?",
        "options": [
          "Que sejam engraçadas, mesmo que alguém se magoe.",
          "Que edifiquem e façam bem a quem ouve.",
          "Que a gente fique sempre calado."
        ],
        "correct": 1,
        "explanation": "Paulo pede palavras que edificam e fazem bem a quem ouve. Ficar calado diante de uma humilhação também não resolve."
      }
    }
  ],
  "exercise": {
    "id": "convite-lanche",
    "prompt": "Depois do culto, o grupo combina um lanche. O Lucas está sozinho, mexendo no celular. Um amigo seu diz: “Deixa ele. Se quisesse vir, já tinha pedido.” O que você faz?",
    "options": [
      "Concordo com meu amigo: se o Lucas quisesse ir, teria pedido.",
      "Vou até o Lucas, convido para o lanche e respeito se ele preferir não ir.",
      "Chamo o Lucas bem alto, na frente de todo mundo, para ele não ter como recusar."
    ],
    "correct": 1,
    "explanation": "Quem é novo nem sempre se sente à vontade para pedir. Um convite pessoal abre a porta, e respeitar a resposta deixa a pessoa livre. Chamar na frente de todos pressiona e expõe."
  },
  "questions": [
    {
      "id": "q1",
      "prompt": "Por que o cristão acolhe as pessoas, segundo Romanos 15:7?",
      "options": [
        "Porque assim o grupo fica maior e mais animado.",
        "Porque Cristo nos recebeu primeiro, para a glória de Deus.",
        "Porque quem acolhe ganha mais pontos com Deus."
      ],
      "correct": 1,
      "explanation": "Acolhemos porque fomos acolhidos por Cristo. Não é para ganhar algo nem só para o grupo crescer: é resposta ao que Ele fez por nós."
    },
    {
      "id": "q2",
      "prompt": "O que o início do Salmo 139 mostra?",
      "options": [
        "Que quem tem fé nunca se sente sozinho.",
        "Que precisamos contar tudo sobre nós para o grupo.",
        "Que Deus conhece profundamente cada pessoa."
      ],
      "correct": 2,
      "explanation": "Davi se admira porque Deus o conhece por completo. O salmo não promete que nunca haverá solidão e não exige que a gente se exponha."
    },
    {
      "id": "q3",
      "prompt": "Em 1 Coríntios 12, o que faz da Igreja um só corpo?",
      "options": [
        "O mesmo Espírito, que une os membros e distribui os dons.",
        "Todos terem os mesmos talentos e o mesmo jeito.",
        "Seguir quem aparece mais nas atividades."
      ],
      "correct": 0,
      "explanation": "Paulo ensina que fomos batizados em um mesmo Espírito para formar um só corpo. As diferenças continuam; é o Espírito quem une."
    },
    {
      "id": "q4",
      "prompt": "O grupo usa um apelido de que o Lucas não gosta, e ele pede para parar. O que fazer?",
      "options": [
        "Ficar quieto para não criar problema com o grupo.",
        "Parar de usar o apelido e, se a zoação continuar, avisar um adulto responsável.",
        "Rir junto, porque é só brincadeira e ele vai se acostumar."
      ],
      "correct": 1,
      "explanation": "Efésios 4:29 pede palavras que edificam. Respeitar o pedido já é cuidar; se a humilhação continuar, buscar um adulto protege."
    },
    {
      "id": "q5",
      "prompt": "Qual destas atitudes é acolher sem expor?",
      "options": [
        "Pedir que a pessoa nova conte a história dela para o grupo todo.",
        "Postar uma foto da pessoa nova para mostrar que ela foi bem recebida.",
        "Se apresentar, oferecer companhia e deixar a pessoa escolher como participar."
      ],
      "correct": 2,
      "explanation": "Acolher é abrir espaço. Contar a própria história e aparecer em foto são escolhas da pessoa, não condições para pertencer."
    }
  ],
  "practice": "Em uma atividade do grupo com adultos por perto, apresente-se a alguém novo ou que você conhece pouco, ofereça companhia e respeite a escolha da pessoa. Não envie foto, nome nem relato. Depois, peça a validação da liderança. Se não puder participar, combine com um adulto responsável uma simulação de acolhimento como alternativa.",
  "closing": "Cristo me recebeu; por isso, eu recebo os outros. Posso perguntar, aprender e contribuir, e ninguém deve ficar invisível.",
  "prayer": "Senhor Jesus, obrigado porque o Senhor me conhece e me recebeu. Ajuda-me a enxergar quem está sozinho e a acolher com respeito. Que o Espírito Santo me dê coragem e palavras que edificam. Amém.",
  "achievement": "Comecei Minha Jornada",
  "media": {
    "coverAsset": null,
    "illustrationAsset": null,
    "alt": "Pessoas diferentes reunidas em um círculo de acolhimento",
    "credit": "Composição geométrica original do projeto",
    "license": "Sem mídia externa",
    "videoUrl": null,
    "transcript": null,
    "captions": null,
    "poster": null
  },
  "rules": {
    "passingPercent": 70,
    "xp": {
      "reading": 40,
      "exercise": 30,
      "quiz": 60,
      "summary": 10,
      "practice": 80
    }
  }
}$content$::jsonb);

create or replace function public.learning_snapshot(target_ministry uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  staff boolean; v public.learning_versions; p public.learning_publications;
  e public.learning_enrollments; safe_content jsonb; students jsonb; editors jsonb;
  own_student uuid; own_progress jsonb;
begin
  if not public.is_own_ministry(target_ministry) then raise exception 'learning_access_denied'; end if;
  staff := public.has_ministry_role(target_ministry, array['leader','admin']::public.member_role[]);
  select * into v from public.learning_versions where world_slug = 'voce-faz-parte' order by version desc limit 1;
  if not found then raise exception 'learning_not_installed'; end if;
  select * into p from public.learning_publications where ministry_id = target_ministry and version_id = v.id;
  if staff then
    select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.full_name,
      'hasAccount', s.auth_user_id is not null, 'enrollment',
      case when le.id is null then null else to_jsonb(le) || jsonb_build_object('xp',
        (select coalesce(sum(x.amount),0) from public.learning_xp_ledger x where x.enrollment_id = le.id),
        'reviews', (select coalesce(jsonb_agg(jsonb_build_object('decision',r.decision,'mode',r.mode,'note',r.note,'created_at',r.created_at) order by r.created_at desc),'[]'::jsonb)
          from public.learning_activity_reviews r where r.enrollment_id = le.id)) end)
      order by s.full_name), '[]'::jsonb)
    into students from public.students s left join public.learning_enrollments le
      on le.student_id = s.id and le.publication_id = p.id
    where s.ministry_id = target_ministry and s.is_active and s.status <> 'archived';
    select coalesce(jsonb_agg(jsonb_build_object('id', mm.profile_id, 'name', pr.full_name) order by pr.full_name), '[]'::jsonb)
    into editors from public.ministry_members mm join public.profiles pr on pr.id = mm.profile_id
    where mm.ministry_id = target_ministry and mm.is_active and mm.role in ('leader','admin');
    return jsonb_build_object('publication', case when p.id is null then null else to_jsonb(p) end, 'content', v.content,
      'students', students, 'editors', editors, 'enrollment', null);
  end if;
  select s.id into own_student from public.students s where s.ministry_id = target_ministry
    and s.auth_user_id = auth.uid() and s.is_active and s.status <> 'archived'
    and public.has_ministry_role(target_ministry, array['student']::public.member_role[]);
  if own_student is null then raise exception 'learning_access_denied'; end if;
  select * into e from public.learning_enrollments where publication_id = p.id and student_id = own_student and is_active;
  if e.id is not null then
    own_progress := (to_jsonb(e) - array['review_note','reviewed_by','enrolled_by']) || jsonb_build_object(
      'xp', (select coalesce(sum(amount),0) from public.learning_xp_ledger where enrollment_id = e.id),
      'last_quiz', (select result from public.learning_quiz_attempts where enrollment_id = e.id order by created_at desc, id desc limit 1));
  end if;
  -- Archived versions stay readable (never writable) for learners who completed them.
  if e.id is not null and (p.state = 'published' or (p.state = 'archived' and e.completed_at is not null)) then
    safe_content := v.content || jsonb_build_object(
      'cards', (select jsonb_agg(case when c ? 'checkpoint' then jsonb_set(c,'{checkpoint}',(c->'checkpoint') - array['correct','explanation']) else c end order by n)
        from jsonb_array_elements(v.content->'cards') with ordinality t(c,n)),
      'exercise', (v.content->'exercise') - array['correct','explanation'],
      'questions', (select jsonb_agg(q - array['correct','explanation']) from jsonb_array_elements(v.content->'questions') q));
  end if;
  return jsonb_build_object('publication', case when p.id is null then null else jsonb_build_object('state',p.state) end,
    'content', safe_content, 'enrollment', own_progress, 'students', '[]'::jsonb, 'editors', '[]'::jsonb);
end; $$;

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
  select * into v from public.learning_versions where world_slug = 'voce-faz-parte' order by version desc limit 1;
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
            -- Reading gate: a card with a checkpoint counts only after a correct
            -- answer; a wrong answer returns feedback without progress.
            select card into q from jsonb_array_elements(v.content->'cards') t(card) where card->>'id' = reading_id;
            if q ? 'checkpoint' and not reading_id = any(e.readings) then
              choice := payload->'answer';
              if choice is null or not exists(select 1 from generate_series(0,jsonb_array_length(q#>'{checkpoint,options}')-1) n
                where to_jsonb(n) = choice) then raise exception 'learning_invalid_input'; end if;
              passed := choice = q#>'{checkpoint,correct}';
              outcome := jsonb_build_object('correct',passed,'explanation',q#>>'{checkpoint,explanation}');
              if not passed then return outcome; end if;
            end if;
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
