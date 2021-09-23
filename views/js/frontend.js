let updater;

const p_alternatives = [...document.getElementsByClassName("wrong"), ...document.getElementsByClassName("correct")];

// hilight the correct and wrong answers
function hilight_answers() {
    var head = document.getElementsByTagName("head")[0]; 

    var link = document.createElement("link")
    link.rel  = "stylesheet";
    link.type = "text/css";
    link.href = "/hilight_answers.css";

    head.appendChild(link);
}

// registrer the answer in the form
function submit_answer(answer) {
    hilight_answers()

    document.getElementById("input-answer").value = answer;
    document.getElementById("input-next-question").style.display = "block";
    
    // remove the abilit to submit a answer
    p_alternatives.forEach(element => element.onclick = function(){});
}

// handle click on alternatives
p_alternatives.forEach(element => element.onclick = function(){
    submit_answer(this.id);
    clearInterval(updater);
});

// clock
const time = document.getElementById("time").value;

if (time > 0) {
    (function startClock() {    
        const progress_bar = document.getElementById("progress-bar-front");

        let width = 100;

        updater = setInterval(stateHandler, time);

        function stateHandler() {
            if (width <= 0) {
                clearInterval(updater);
                submit_answer(document.getElementsByClassName("wrong")[0].id);
            } else {
                width -= 0.1;
                progress_bar.style.width = width.toString() + "%";
            }
        }
    }) ()
}