export interface JobApplication {
  id: string;
  date: string;
  company_name: string;
  title: string;
  job_url: string | null;
  profile_id: string | null;
  resume_file_name: string;
  job_description?: string;
  /** 0 = not applied, 1 = applied */
  applied_manually?: number;
  gpt_chat_url?: string | null;
  created_at: string;
}

export interface ProfileMeta {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  title?: string;
  email?: string;
  location?: string;
}
