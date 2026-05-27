export interface GitHubUser {
  id: number;
  login: string;
  email: string;
  avatar_url: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}