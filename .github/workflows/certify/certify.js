const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

const main = async () => {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2)
    // console.log(`The event payload: ${payload}`);

    // Get the audits we want to certify
    const certsRaw = core.getInput('audits');
    console.log(`certs raw: ${certsRaw}`);
    const certsDecoded = Buffer.from(certsRaw, "base64");
    console.log(`certs decoded: ${certsDecoded}`);
    const certs = JSON.parse(certsDecoded);
    console.log(`certs given: ${certs}`);

    // Setup github/octokit stuff
    const { context = {} } = github;
    const { pull_request } = context.payload;

    const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
    const octokit = github.getOctokit(GITHUB_TOKEN);

    console.log("certifying...");
    // Apply the certifies!
    for (const cert of certs) {
      // We're certifying...
      const cmd = "cargo";
      let args = ["vet", "certify"];

      // Add various metadata
      for (const criteria of cert.criteria) {
          args.push("--criteria",  criteria);
      }
      if (dependency_criteria) {
        for (const dependency_criteria of cert.dependency_criteria) {
            console.log("dependency_criteria not yet supported!");
        }
      }

      args.push("--who", cert.who);
      args.push("--notes", cert.notes);
      // No prompts, the author already signed off!
      args.push("--accept-all");
      // Don't bother checking if the package/version makes sense?
      args.push("--force");

      // Now add the position package/version info
      args.push(cert.package);
      args.push(cert.version1);
      if (cert.version2) {
          args.push(cert.version2);
      }

      await exec.exec(cmd, args);
    }

    
    // Print out the result
    await exec.exec("git", "diff");
        
    // Now create a commit!
    await exec.exec("git", ["config", "--local", "user.name", "github-actions[bot]"]);
    await exec.exec("git", ["config", "--local", "user.email", "github-actions[bot]@users.noreply.github.com"]);
    await exec.exec("git", ["commit", "-am", "[cargo-vet] add new audits"]);
    await exec.exec("git", ["push"]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
