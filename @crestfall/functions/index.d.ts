export interface repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  archived: boolean;
  fork: boolean;
  default_branch: string;
}
export interface commit {
  sha: string;
}