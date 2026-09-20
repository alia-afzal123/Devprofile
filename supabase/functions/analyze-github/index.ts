
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type GitHubRepo = {
  name: string;
  fork: boolean;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number;
  updated_at: string;
  pushed_at: string | null;
  homepage: string | null;
  topics?: string[];
  archived?: boolean;
};

type GitHubProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  updated_at: string;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function daysSince(dateString?: string | null) {
  if (!dateString) return Infinity;

  const date = new Date(dateString);
  const now = new Date();

  return Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
}

async function githubFetch(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "DevProfile",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("GitHub profile or resource not found.");
    }

    if (response.status === 403) {
      throw new Error(
        "GitHub API rate limit or permission limit reached."
      );
    }

    throw new Error(
      `GitHub API request failed with status ${response.status}.`
    );
  }

  return response.json();
}

async function hasReadme(
  username: string,
  repoName: string,
  token: string
) {
  const response = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/readme`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "DevProfile",
      },
    }
  );

  return response.ok;
}

function calculateAnalysis({
  profile,
  repos,
  events,
  readmeCount,
  readmeChecked,
}: {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  events: any[];
  readmeCount: number;
  readmeChecked: number;
}) {
  const originalRepos = repos.filter(
    (repo) => !repo.fork && !repo.archived
  );

  const projectRepos =
    originalRepos.length > 0 ? originalRepos : repos;

  /*
   * 01. ACTIVITY RHYTHM
   */

  const active30Days = projectRepos.filter(
    (repo) => daysSince(repo.pushed_at || repo.updated_at) <= 30
  ).length;

  const active90Days = projectRepos.filter(
    (repo) => daysSince(repo.pushed_at || repo.updated_at) <= 90
  ).length;

  const active365Days = projectRepos.filter(
    (repo) => daysSince(repo.pushed_at || repo.updated_at) <= 365
  ).length;

  const recentEvents30Days = events.filter(
    (event) => daysSince(event.created_at) <= 30
  ).length;

  let activityScore = 0;

  if (active365Days >= 1) activityScore += 20;
  if (active90Days >= 1) activityScore += 20;
  if (active30Days >= 1) activityScore += 20;

  if (active90Days >= 3) activityScore += 15;
  if (recentEvents30Days >= 5) activityScore += 15;
  if (recentEvents30Days >= 15) activityScore += 10;

  activityScore = clampScore(activityScore);

  /*
   * 02. REPOSITORY QUALITY
   */

  const reposWithDescription = projectRepos.filter(
    (repo) => repo.description?.trim()
  ).length;

  const reposWithLanguage = projectRepos.filter(
    (repo) => repo.language
  ).length;

  const totalStars = projectRepos.reduce(
    (sum, repo) => sum + (repo.stargazers_count || 0),
    0
  );

  const totalForks = projectRepos.reduce(
    (sum, repo) => sum + (repo.forks_count || 0),
    0
  );

  const descriptionRatio =
    projectRepos.length > 0
      ? reposWithDescription / projectRepos.length
      : 0;

  const languageRatio =
    projectRepos.length > 0
      ? reposWithLanguage / projectRepos.length
      : 0;

  let repositoryQualityScore = 0;

  repositoryQualityScore += descriptionRatio * 30;
  repositoryQualityScore += languageRatio * 20;

  if (originalRepos.length >= 3) repositoryQualityScore += 15;
  if (originalRepos.length >= 6) repositoryQualityScore += 10;

  if (totalStars >= 1) repositoryQualityScore += 5;
  if (totalStars >= 10) repositoryQualityScore += 10;

  if (totalForks >= 1) repositoryQualityScore += 5;
  if (totalForks >= 10) repositoryQualityScore += 5;

  repositoryQualityScore = clampScore(repositoryQualityScore);

  /*
   * 03. DOCUMENTATION
   */

  const readmeRatio =
    readmeChecked > 0 ? readmeCount / readmeChecked : 0;

  const reposWithTopics = projectRepos.filter(
    (repo) =>
      Array.isArray(repo.topics) &&
      repo.topics.length > 0
  ).length;

  const reposWithHomepage = projectRepos.filter(
    (repo) => repo.homepage?.trim()
  ).length;

  const topicsRatio =
    projectRepos.length > 0
      ? reposWithTopics / projectRepos.length
      : 0;

  const homepageRatio =
    projectRepos.length > 0
      ? reposWithHomepage / projectRepos.length
      : 0;

  let documentationScore = 0;

  documentationScore += readmeRatio * 50;
  documentationScore += descriptionRatio * 25;
  documentationScore += topicsRatio * 15;
  documentationScore += homepageRatio * 10;

  documentationScore = clampScore(documentationScore);

  /*
   * 04. PROJECT DEPTH
   */

  const languages = new Set(
    projectRepos
      .map((repo) => repo.language)
      .filter(Boolean)
  );

  const substantialRepos = projectRepos.filter(
    (repo) => (repo.size || 0) >= 500
  ).length;

  let projectDepthScore = 0;

  if (originalRepos.length >= 2) projectDepthScore += 15;
  if (originalRepos.length >= 5) projectDepthScore += 15;
  if (originalRepos.length >= 10) projectDepthScore += 10;

  if (languages.size >= 2) projectDepthScore += 15;
  if (languages.size >= 4) projectDepthScore += 15;
  if (languages.size >= 6) projectDepthScore += 10;

  if (substantialRepos >= 2) projectDepthScore += 10;
  if (substantialRepos >= 5) projectDepthScore += 5;

  if (totalStars >= 10) projectDepthScore += 5;

  projectDepthScore = clampScore(projectDepthScore);

  /*
   * 05. PROFILE COMPLETENESS
   */

  const profileFields = [
    profile.name,
    profile.bio,
    profile.company,
    profile.location,
    profile.blog,
  ];

  const completedFields = profileFields.filter(
    (field) =>
      typeof field === "string" &&
      field.trim().length > 0
  ).length;

  let profileCompletenessScore =
    (completedFields / profileFields.length) * 70;

  if (profile.avatar_url) profileCompletenessScore += 5;

  if (profile.public_repos >= 3) {
    profileCompletenessScore += 10;
  }

  if (profile.followers >= 1) {
    profileCompletenessScore += 5;
  }

  if (profile.created_at) {
    profileCompletenessScore += 10;
  }

  profileCompletenessScore = clampScore(
    profileCompletenessScore
  );

  /*
   * OVERALL SCORE
   */

  const overallScore = clampScore(
    activityScore * 0.2 +
      repositoryQualityScore * 0.25 +
      documentationScore * 0.2 +
      projectDepthScore * 0.2 +
      profileCompletenessScore * 0.15
  );

  /*
   * FEEDBACK
   */

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (activityScore >= 70) {
    strengths.push(
      "Your GitHub shows recent and consistent development activity."
    );
  } else {
    weaknesses.push(
      "Your recent public GitHub activity is limited."
    );

    suggestions.push(
      "Maintain consistent public development activity across meaningful projects."
    );
  }

  if (repositoryQualityScore >= 70) {
    strengths.push(
      "Your repositories provide strong project quality signals."
    );
  } else {
    weaknesses.push(
      "Some repositories lack strong quality signals."
    );

    suggestions.push(
      "Add clear descriptions, project metadata, and maintain more original repositories."
    );
  }

  if (documentationScore >= 70) {
    strengths.push(
      "Your repositories demonstrate good documentation coverage."
    );
  } else {
    weaknesses.push(
      "Repository documentation can be improved."
    );

    suggestions.push(
      "Add useful README files, descriptions, topics, and live project links."
    );
  }

  if (projectDepthScore >= 70) {
    strengths.push(
      "Your GitHub demonstrates solid project depth and technical diversity."
    );
  } else {
    weaknesses.push(
      "Your public projects show limited depth or technology diversity."
    );

    suggestions.push(
      "Build larger original projects that demonstrate architecture, problem solving, and multiple technologies."
    );
  }

  if (profileCompletenessScore >= 70) {
    strengths.push(
      "Your GitHub profile provides useful professional context."
    );
  } else {
    weaknesses.push(
      "Your GitHub profile is missing useful professional information."
    );

    suggestions.push(
      "Complete your bio, location, company, and portfolio or website link."
    );
  }

  return {
    overallScore,

    scores: {
      activityRhythm: activityScore,
      repositoryQuality: repositoryQualityScore,
      documentation: documentationScore,
      projectDepth: projectDepthScore,
      profileCompleteness: profileCompletenessScore,
    },

    metrics: {
      publicRepos: profile.public_repos,
      analyzedRepos: repos.length,
      originalRepos: originalRepos.length,

      active30Days,
      active90Days,
      active365Days,

      recentEvents30Days,

      totalStars,
      totalForks,

      languages: Array.from(languages),

      readmesFound: readmeCount,
      readmesChecked: readmeChecked,
    },

    strengths,
    weaknesses,
    suggestions,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const githubToken =
      Deno.env.get("GITHUB_TOKEN");

    if (!githubToken) {
      throw new Error(
        "GitHub API token is not configured."
      );
    }

    const body = await req.json();

    let username = body.username;

    if (!username || typeof username !== "string") {
      return new Response(
        JSON.stringify({
          error: "GitHub username is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    username = username
      .replace("https://github.com/", "")
      .replace("http://github.com/", "")
      .replace("@", "")
      .replace(/\/$/, "")
      .trim();

    if (!username) {
      throw new Error(
        "Invalid GitHub username."
      );
    }

    /*
     * PROFILE
     */

    const profile: GitHubProfile =
      await githubFetch(
        `https://api.github.com/users/${username}`,
        githubToken
      );

    /*
     * REPOSITORIES
     */

    const repos: GitHubRepo[] =
      await githubFetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=updated&type=public`,
        githubToken
      );

    /*
     * PUBLIC EVENTS
     */

    let events: any[] = [];

    try {
      events = await githubFetch(
        `https://api.github.com/users/${username}/events/public?per_page=100`,
        githubToken
      );
    } catch {
      events = [];
    }

    /*
     * README CHECK
     *
     * Check up to 10 meaningful original repos
     * to control GitHub API usage.
     */

    const readmeCandidates = repos
      .filter(
        (repo) =>
          !repo.fork &&
          !repo.archived
      )
      .sort(
        (a, b) =>
          (b.stargazers_count || 0) -
          (a.stargazers_count || 0)
      )
      .slice(0, 10);

    const readmeResults =
      await Promise.all(
        readmeCandidates.map((repo) =>
          hasReadme(
            username,
            repo.name,
            githubToken
          )
        )
      );

    const readmeCount =
      readmeResults.filter(Boolean).length;

    /*
     * ANALYSIS
     */

    const analysis = calculateAnalysis({
      profile,
      repos,
      events,
      readmeCount,
      readmeChecked:
        readmeCandidates.length,
    });

    return new Response(
      JSON.stringify({
        success: true,

        profile: {
          login: profile.login,
          name: profile.name,
          avatarUrl: profile.avatar_url,
          profileUrl: profile.html_url,
          bio: profile.bio,
          company: profile.company,
          location: profile.location,
          website: profile.blog,
          followers: profile.followers,
          following: profile.following,
          publicRepos: profile.public_repos,
          createdAt: profile.created_at,
        },

        analysis,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "GitHub analysis error:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "GitHub analysis failed.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});