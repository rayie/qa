/*
Question Types

Free text answer
Multiple Choice
  - 1 and only 1 option may be selected
  - Min max range of options  
    1:2 - Up to 2 options may be selected
    


*/

/*
 * Multiple choice
 * Data structure representing a question
 *
 */

{
  _id: 100,
  kind: "mc",
  txt: "Who usually takes care of your COPD?",
  opts: [
    { 
      txt: "Pulmonologist",
      ask: 110
    },
    { 
      txt: "Primary Care Physician (PCP)" 
      ask: 120
    }
  ],
  minmax: [ 1, 1 ],
}

{
  _id: 110,
  kind: "ft", //free text
  txt: "How often do you see your Pulmonologist"
}


{
  _id: 120,
  kind: "ft", //free text
  txt: "How often do you see your Primary Care Physician"
}

{
  _id: 130,
  kind: "int",  //positive integer
  txt: "In the last 12 months, how many times have you been to the hospital or ER for your respiratory condition?",
  range: [ 0, 100 ],
  rule: { 
    if: { gt: 0 },
    ask: [ 135 ]
  }
}

{
  _id: 135,
  kind: "ft",
  txt: "Please explain/elaborate on your hospital or ER visitations that occurred in the past 12 months",

}

{
  _id: 140,
  kind: "yn",
  txt: "Do you use oxygen?",
  rule: {
    if: true,
    ask: [141,142]
  }
}

{
  _id: 141,
  kind: "flt",
  txt: "What is your oxygen usage rate (Liters per minute)",
  unit: "LPM of Oxygen"
}  

{ 
  _id: 142,
  kind: "mc",
  txt: "What is the frequency of your oxygen usage?",
  opts:[
    { txt: "With meals" },
    { txt: "With shortness of breath" },
    { txt: "With activity" },
    { txt: "During sleep" },
    { txt: "Continuous" }
  ]
  minmax: [ 1, 5]
}

{
  _id: 200,
  kind: "mc",
  txt: "What makes your COPD worse (triggers, irritants)",
  opts: [
    { txt: "Smoke" },
    { txt: "Very cold air" },
    { txt: "Strong odors" },
    { txt: "Lung infections" },
    { txt: "Traffic fumes and environmental pollutants" }
    { txt: "Other" },
  ],
  minmax: [ 1,5 ],  // respondent may select 1 or more 
  tags: ["copd","exacerbations"]
}





