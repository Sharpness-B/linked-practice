/*

user story: I want to practice in a similar environment to the actual linkedin in quiz

solution:
    1 choose quiz and spesification
    2 read and randomize questions
    3 run the quiz
    4 present results

*/

const express = require("express");
const { readdirSync, readdir, readFile, readFileSync } = require("fs");
const path = require('path');

const app = express();

app.set("view engine", "ejs");

app.use("/style.css",           express.static(__dirname + "/views/css/style.css"));
app.use("/hilight_answers.css", express.static(__dirname + "/views/css/hilight_answers.css"));
app.use("/frontend.js",         express.static(__dirname + "/views/js/frontend.js"));
app.use("/logo.png",            express.static(__dirname + "/views/partials/logo.png"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// index page with link to every quiz
app.get("/", (request, response) => {
    const quizzes = readdirSync("linkedin-skill-assessments-quizzes", { withFileTypes: true })
                    .filter(item => item.isDirectory())
                    .map(item => item.name)
                    .filter(item => ![".git",".github"].includes(item));

    response.render("index", {quizzes: quizzes});
});



// load quiz and set configuration
app.get("/start/:quiz", (request, response) => {
    const quiz = request.params.quiz;

    const time = request.query["input-time"];
    const input_n_questions = request.query["input-n-questions"];

    // find the .md file of the folder
    const folderPath = path.join("linkedin-skill-assessments-quizzes", quiz);
    readdir(folderPath, (error, files) => {
        if (error) {
            response.send(`<pre>The quiz, ${quiz}, was not found!</pre>`);
        }

        const mdFilename = files.filter(file => file.endsWith(".md"))[0]; // `${quiz}-quiz.md`;
        const filePath = path.join("linkedin-skill-assessments-quizzes", quiz, mdFilename);

        // read file
        readFile(filePath, "utf-8", (error, data) => {
            if (error) {
                response.send(error);
            }

            // array of questions [{question,alternatives,correct}]
            const questions = data.replace(/(\r\n|\n|\r)/gm, "") // <br> does not work
                                  .split("####").map(value => value.split("- "))
                                  .map(q => ({
                                      id:           q[0].substring(1).split(".")[0],
                                      question:     q[0].substring(5), 
                                      alternatives: q.filter(a => a.startsWith("[")).map(a => a.substring(4).split("[explanation]")[0].split("**Explanation:**")[0]),
                                      correct:      q.filter(a => a.startsWith("[")).map(a => a.substring(1,2))
                                                     .indexOf("x")
                                  }));

            // get subject and remove subject title (first element) from questions
            questions.shift();
            const subject = data.replace(/(\r\n|\n|\r)/gm,"").split("####")[0].substring(3);

            // shuffle and pick questions
            const n_questions = (questions.length > input_n_questions && input_n_questions!=0) ? input_n_questions : questions.length;
            const chosen_questions = questions.sort(() => Math.random() - Math.random()).slice(0, n_questions);

            // ready!
            response.render("ready", {
                chosen_questions: encodeURIComponent(JSON.stringify(chosen_questions)), 
                n_questions: n_questions, 
                time: time,
                subject: subject
            });
        });
    });
});



// play! the answers are passed to the next round in the post request. probably not the best way
app.post("/round/:round", (request,response) => {
    const round = parseInt(request.params.round);

    const chosen_questions = JSON.parse(decodeURIComponent( request.body.chosen_questions ));
    const n_questions      = request.body.n_questions;
    const time             = request.body.time;
    const subject          = request.body.subject;

    const questionObject = chosen_questions[round];
    const question     = questionObject.question;
    const alternatives = questionObject.alternatives;
    const correct      = questionObject.correct;

    const next = round + 1;
    
    let next_link = `/round/${next}`;

    if (next == n_questions) {
        next_link = "/results";
    }

    // save result
    if (round != 0) {
        const prev_anser = parseInt(request.body.answer);
        chosen_questions[round - 1].answer = prev_anser;
    }

    response.render("quiz", {
        chosen_questions: encodeURIComponent(JSON.stringify(chosen_questions)), 
        n_questions: n_questions, 
        time: time,
        subject: subject,
        
        question: question, 
        alternatives: alternatives, 
        correct: correct,
        next_link: next_link
    });
});



// evalueate results
app.post("/results",(request,response) => {
    const chosen_questions = JSON.parse(decodeURIComponent( request.body.chosen_questions ));
    
    // save result from the last question
    const prev_anser = parseInt(request.body.answer);
    chosen_questions[chosen_questions.length - 1].answer = prev_anser;
    
    
    // run through the answers
    const n_correct_answers = chosen_questions.filter(question => question.correct === question.answer).length;
    const n_questions = chosen_questions.length;

    const percentage = Math.round(100*n_correct_answers/n_questions).toString() + "%"

    // presnt results
    const subject = request.body.subject;

    response.render("results", {
        subject: subject,
        n_correct_answers: n_correct_answers,
        n_questions: n_questions,
        percentage: percentage
    })
});



app.listen(
    process.env.PORT || 420, 
    () => console.log("You can't win a rat race without a rat! http://localhost:420")
);