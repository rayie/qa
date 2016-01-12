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
var sample_survey = [
  {
    _id: 100,
    kind: "mc",
    txt: "Who usually takes care of your COPD?",
    sub: "",
    opts: [
      { 
        txt: "Pulmonologist",
        ask: [110]
      },
      { 
        txt: "Primary Care Physician (PCP)" ,
        ask: [120],
        prompt: "text that shouls show up if this answer is selected"
      }
    ],
    minmax: [ 1, 1 ]
  },

  {
    _id: 110,
    kind: "ft", //free text
    precision: 0,
    txt: "How often do you see your Pulmonologist",
    sub: "",
    hidden: true
  },

  {
    _id: 120,
    kind: "ft", //free text
    txt: "How often do you see your Primary Care Physician",
    hidden: true
  },

  {
    _id: 130,
    kind: "ne",  //numeric entry
    txt: "In the last 12 months, how many times have you been to the hospital or ER for your respiratory condition?",
    sub: "",
    precision: 0, 
    range: [ 0, null ],
    rule: { 
      if: { gt: 0 },
      ask: [ 135 ]
    }
  },

  {
    _id: 135,
    kind: "ft",
    txt: "Please explain/elaborate on your hospital or ER visitations that occurred in the past 12 months",
    sub: "",
    hidden: true
  },

  {
    _id: 140,
    kind: "yn",
    txt: "Do you use oxygen?",
    rule: {
      "y":{
        ask: [141,142]
      },
      "n":{
        ask: [143]
      }
    }
  },

  {
    _id: 141,
    kind: "ne",
    precision: 2, 
    txt: "What is your oxygen usage rate (Liters per minute)",
    unit: "LPM of Oxygen",
    hidden: true
  },

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
    ],
    minmax: [ 1, 5],
    hidden: true
  },


  { 
    _id: 143,
    kind: "yn",
    txt: "Have you ever been recommended to use Oxygen?",
    hidden: true
  },

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
    ],
    minmax: [ 1,5 ],  // respondent may select 1 or more 
    tags: ["copd","exacerbations"]
  },
  {
    _id: 300,
    kind: "range",
    txt:  "...",
    range: [ 0, 10 ],
    lbls: [ "None at all", "Moderate", "Severe", "Maximal" ]
  }

];
