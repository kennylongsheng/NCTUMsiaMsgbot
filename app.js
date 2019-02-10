let userScore = 0;
let compScore = 0;
const rock_div = document.getElementById("r");
const paper_div = document.getElementById("p");
const scissors_div = document.getElementById("s");
const userScore_span = document.getElementById("userScore");
const compScore_span = document.getElementById("compScore");
const resultMsg_p = document.querySelector(".resultMsg >p");

function convert(letter){
	if(letter === "r")
		{return "Rock";}
	else if(letter === "p")
		{return "Paper";}
	else if(letter === "s")
		{return "Scissors";}
}

function win(userChoice,compChoice){
	const sUser = "user".fontsize(3).sub();
	const sComp = "comp".fontsize(3).sub();
	const choise_div = document.getElementById(userChoice);
	userScore ++;
	userScore_span.innerHTML = userScore;
	compScore_span.innerHTML = compScore;
	resultMsg_p.innerHTML = `${convert(userChoice)}${sUser} beats ${convert(compChoice)}${sComp}.<br />You Win!`
	choise_div.classList.add('green-glow');
	setTimeout(()=>choise_div.classList.remove('green-glow'),300)
}
function lose(userChoice,compChoice){
	const sUser = "user".fontsize(3).sub();
	const sComp = "comp".fontsize(3).sub();
	const choise_div = document.getElementById(userChoice);
	compScore ++;
	userScore_span.innerHTML = userScore;
	compScore_span.innerHTML = compScore;
	resultMsg_p.innerHTML = `${convert(compChoice)}${sComp} beats ${convert(userChoice)}${sUser}.<br />You Lose!`
	choise_div.classList.add('red-glow');
	setTimeout(()=>choise_div.classList.remove('red-glow'),300)
}
function draw(userChoice,compChoice){
	const sUser = "user".fontsize(3).sub();
	const sComp = "comp".fontsize(3).sub();
	const choise_div = document.getElementById(userChoice);
	resultMsg_p.innerHTML = `${convert(userChoice)}${sUser} equal.<br />It's A Draw!`
	choise_div.classList.add('grey-glow');
	setTimeout(()=>choise_div.classList.remove('grey-glow'),300)
}

function getCompChoice(){
	const array=['r','p','s'];
	return array[Math.floor(Math.random() * 3)];
};

function game(userChoice){
	const compChoice = getCompChoice()
	console.log(userChoice+compChoice);
	switch(userChoice+compChoice){
		case "rs":
		case "pr":
		case "sp":
			//console.log("User Win! "+userChoice+" "+compChoice);
			win(userChoice,compChoice);
			break;
		case "rp":
		case "ps":
		case "sr":
			//console.log("User Lose! "+userChoice+" "+compChoice);
			lose(userChoice,compChoice);
			break;
		case "rr":
		case "pp":
		case "ss":
			//console.log("Draw! "+userChoice+" "+compChoice);
			draw(userChoice,compChoice);
			break;
	}
}

function main(){
	rock_div.addEventListener('click',function(){
		game("r");
	});
	paper_div.addEventListener('click',function(){
		game("p");
	});
	scissors_div.addEventListener('click',function(){
		game("s");
	});
};

main();