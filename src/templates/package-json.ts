export function generatePackageJson(projectName: string): object {
  return {
    name: projectName,
    version: "1.0.0",
    private: true,
    scripts: {
      save: "claudeslide save",
      validate: "claudeslide validate",
      fix: "claudeslide validate --fix",
      preview: "claudeslide preview",
      restore: "claudeslide restore",
    },
  };
}
