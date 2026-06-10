const { execSync } = require("child_process");
const repo = __dirname;

function run(cmd, env = process.env) {
  console.log(">", cmd);
  return execSync(cmd, { cwd: repo, encoding: "utf8", env }).trim();
}

run("git add -A");
const status = run("git status --short");
if (!status) {
  console.log("Nothing to commit");
  process.exit(0);
}

const authorEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "Pranabh Dubey",
  GIT_AUTHOR_EMAIL: "2k22.cse2211125@gmail.com",
  GIT_COMMITTER_NAME: "Pranabh Dubey",
  GIT_COMMITTER_EMAIL: "2k22.cse2211125@gmail.com",
};

const tree = run("git write-tree");
const parent = run("git rev-parse HEAD");
const commit = run(
  `git commit-tree ${tree} -p ${parent} -m "Add env templates, image assets, and VNPay config support"`,
  authorEnv
);
run(`git reset --hard ${commit}`);
run("git push petcare main");
console.log("Pushed:", commit);
