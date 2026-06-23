import { useQuery } from "@tanstack/react-query";
import { getGithubRepos } from "../api";

export function useGithubRepos() {
  return useQuery({
    queryKey: ["github-repos"],
    queryFn: getGithubRepos,
    staleTime: 60_000,
  });
}
