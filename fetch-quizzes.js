const fs = require("fs");
const { exec } = require('child_process');

// check if the folder of the quizzes is in place
if (fs.existsSync("./linkedin-skill-assessments-quizzes")) {
    console.log("pulling changes on quizzes...");
    exec("npm run pull-quizzes");
}
else {
    console.log("cloning quizzes...");
    exec("npm run clone-quizzes");
}