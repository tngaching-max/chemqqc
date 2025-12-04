import { Rubric, Example } from './types';

export const DEFAULT_RUBRIC: Rubric = {
  id: 'default-hot',
  name: 'Standard Higher Order Thinking (Chemistry)',
  description: 'Evaluates questions based on their ability to promote analysis, evaluation, and creation in a chemistry context.',
  criteria: `
    1. Does the question go beyond simple recall of facts or definitions?
    2. Does the question require the student to analyze experimental data, evaluate a hypothesis, or design an experiment?
    3. Does the question connect multiple concepts (e.g., stoichiometry and equilibrium)?
    4. Is the question open-ended or does it have multiple valid approaches?
    5. Does the question relate to real-world applications or deeper conceptual understanding?
  `
};

export const DEFAULT_EXAMPLES: Example[] = [
  {
    id: 'ex-1',
    content: "Calculate the molar mass of H2SO4.",
    type: "Lower Order",
    explanation: "This is a simple procedural calculation requiring only recall of atomic masses and basic arithmetic."
  },
  {
    id: 'ex-2',
    content: "A student claims that increasing temperature always increases the rate of reaction. Evaluate this claim with respect to enzymatic reactions and combustion, citing specific thermodynamic or kinetic principles.",
    type: "Higher Order",
    explanation: "Requires evaluation of a claim, comparison of two different systems (biological vs chemical), and application of kinetic theory."
  },
  {
    id: 'ex-3',
    content: "设计一个实验方案，使用常见的实验室试剂来鉴别一瓶丢失标签的白色粉末是碳酸钠还是碳酸氢钠。请说明你的步骤和预期的现象。",
    type: "Higher Order",
    explanation: "Requires experimental design and understanding of chemical properties to differentiate between similar substances (Chinese Context)."
  },
  {
    id: 'ex-4',
    content: "請針對「濃度對反應速率的影響」這一主題，設計一個探究實驗。實驗設計需包含控制變因、操作變因及預期結果，並討論可能產生誤差的來源。",
    type: "Higher Order",
    explanation: "Requires experimental design, identification of variables, and evaluation of error sources (Traditional Chinese Context)."
  }
];

export const SAMPLE_QUESTION = "What is the pH of a 0.1 M HCl solution?";
export const SAMPLE_HOT_QUESTION = "Design an experiment to determine the unknown concentration of a weak acid using only a standard strong base and a pH meter, and explain how you would calculate the Ka from your data.";