/**
 * Balanceador oculto: ~25% (±5%) por resultado (CC, CT, TC, TT) por bloque de 60 ensayos.
 */
(function(){
	"use strict";

	var targetPerOutcome = 15;
	var minPerOutcome = 12;
	var maxPerOutcome = 18;
	var blockCounts = { CC: 0, CT: 0, TC: 0, TT: 0 };

	function resetBlock() {
		blockCounts = { CC: 0, CT: 0, TC: 0, TT: 0 };
	}

	function getAgentMove(humanChoice) {
		var keyC = humanChoice === "C" ? "CC" : "TC";
		var keyT = humanChoice === "C" ? "CT" : "TT";
		var nC = blockCounts[keyC];
		var nT = blockCounts[keyT];
		var canC = nC < maxPerOutcome;
		var canT = nT < maxPerOutcome;
		if (!canC && !canT) return Math.random() < 0.5 ? "C" : "T";
		if (!canC) return "T";
		if (!canT) return "C";
		if (nC < minPerOutcome && nT >= targetPerOutcome) return "C";
		if (nT < minPerOutcome && nC >= targetPerOutcome) return "T";
		if (nC <= nT) return "C";
		return "T";
	}

	function recordOutcome(humanChoice, agentChoice) {
		var key = (humanChoice === "C" ? "C" : "T") + (agentChoice === "C" ? "C" : "T");
		if (blockCounts[key] !== undefined) blockCounts[key]++;
	}

	function getCounts() {
		return { CC: blockCounts.CC, CT: blockCounts.CT, TC: blockCounts.TC, TT: blockCounts.TT };
	}

	window.DPIBalanceador = {
		resetBlock: resetBlock,
		getAgentMove: getAgentMove,
		recordOutcome: recordOutcome,
		getCounts: getCounts
	};
})();
