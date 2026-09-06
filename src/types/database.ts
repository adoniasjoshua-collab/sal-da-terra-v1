export type MemberRole = "student" | "leader" | "admin";
export type StudentStatus = "active" | "inactive" | "visitor" | "archived";
export type EventType = "EBD" | "worship" | "evangelism" | "volunteer_action" | "rehearsal" | "outing" | "congress" | "retreat" | "meeting";
export type AttendanceMode = "full_roster" | "participation_only";
export type EventStatus = "planned" | "open" | "completed" | "cancelled";
export type AttendanceStatus = "present" | "absent" | "justified" | "visitor" | "not_participated";
export type FollowupType = "conversation" | "phone_call" | "whatsapp" | "family_contact" | "visit" | "prayer" | "other";
export type FollowupStatus = "open" | "completed" | "cancelled";

export type StudentRow = { id:string;ministry_id:string;auth_user_id:string|null;full_name:string;preferred_name:string|null;birth_date:string;gender:string|null;phone:string|null;guardian_name:string;guardian_phone:string;guardian_relationship:string;joined_at:string;notes:string|null;status:StudentStatus;is_active:boolean;archived_at:string|null;created_by:string|null;created_at:string;updated_at:string };
export type EventRow = { id:string;ministry_id:string;title:string;type:EventType;event_date:string;start_time:string|null;description:string|null;status:EventStatus;attendance_mode:AttendanceMode;created_by:string|null;created_at:string;updated_at:string };
export type AttendanceRow = { id:string;ministry_id:string;event_id:string;student_id:string;attendance_status:AttendanceStatus;registered_by:string|null;notes:string|null;created_at:string;updated_at:string };
export type PastoralFollowupRow = { id:string;ministry_id:string;student_id:string;leader_id:string;followup_type:FollowupType;occurred_at:string;summary:string;next_action:string|null;next_action_date:string|null;status:FollowupStatus;is_sensitive:boolean;created_at:string;updated_at:string };
