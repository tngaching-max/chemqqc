import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisResult, Rubric, Example } from "../types";

const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.1,
  }
});

// Add Type enum
enum Type {
  STRING = "STRING",
  NUMBER = "NUMBER", 
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
  INTEGER = "INTEGER"
}

export interface FileInput {
  inlineData: {
    data: string;
    mimeType: string;
  }
}

// Add type definition for window.mammoth
declare global {
  interface Window {
    mammoth: any;
  }
}

/**
 * Processes a file and prepares it for the Gemini API.
 * - .docx: Extracts text using mammoth.js -> returns text string
 * - .txt: Reads as text -> returns text string
 * - .pdf/.jpg/.png: Reads as base64 -> returns FileInput object
 */
export const processFile = async (file: File): Promise<string | FileInput> => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // Handle DOCX (Text Extraction)
    if (fileExtension === 'docx' || fileExtension === 'doc') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result;
        if (window.mammoth) {
          window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then((result: any) => resolve(result.value))
            .catch((err: any) => reject(new Error("Failed to parse DOCX file.")));
        } else {
          reject(new Error("Docx parser not loaded."));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
      return;
    }

    // Handle Plain Text
    if (fileExtension === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
      return;
    }

    // Handle PDF and Images (Base64)
    const validMimeTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/webp'
    ];

    if (validMimeTypes.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve({
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    reject(new Error(`Unsupported file type: .${fileExtension}. Please upload .docx, .pdf, .txt, or images.`));
  });
};

export const extractQuestionText = async (input: string | FileInput): Promise<string> => {
  const systemInstruction = `
    You are an assistant helping a teacher create a database of chemistry questions.
    The user has provided a file (either raw text extracted from a document or an image/pdf).
    Your task:
    1. Identify the main chemistry question text in the content.
    2. Transcribe it exactly as written. PRESERVE the original language (English, Simplified Chinese, Traditional Chinese, etc.).
    3. Return ONLY the text string. Do not include labels like "Question:" or markdown code blocks.
  `;

  const isString = typeof input === 'string';
  
  const contents = isString 
    ? { 
        role: 'user', 
        parts: [{ text: `Extract the main chemistry question from this text:\n\n${input}` }] 
      }
    : {
        role: 'user',
        parts: [
          (input as FileInput).inlineData,
          { text: "Extract the main chemistry question from this file." }
        ]
      };

  try {
    const response = await model.generateContent({
      contents: contents,
      systemInstruction: systemInstruction,
    });

    return response.response.text() || "";
  } catch (error) {
    console.error("Extraction Error:", error);
    throw new Error("Failed to extract text from file.");
  }
};

export const extractRubricCriteria = async (input: string | FileInput): Promise<string> => {
  const systemInstruction = `
    You are an assistant helping a teacher configure an AI evaluator.
    The user has provided a document (text or file) that contains a grading rubric, possibly in a table format.
    Your task:
    1. Identify the specific criteria used to evaluate questions (e.g., cognitive level, real-world connection, complexity, etc.).
    2. Extract these criteria and format them as a clear, numbered list.
    3. PRESERVE the original language (English, Simplified Chinese, or Traditional Chinese).
    4. Return ONLY the formatted list of criteria. Do not add conversational text or markdown code blocks.
  `;

  const isString = typeof input === 'string';
  
  const contents = isString 
    ? { 
        role: 'user', 
        parts: [{ text: `Extract the rubric criteria from this text:\n\n${input}` }] 
      }
    : {
        role: 'user',
        parts: [
          (input as FileInput).inlineData,
          { text: "Extract the rubric criteria from this file (it might be in a table)." }
        ]
      };

  try {
    const response = await model.generateContent({
      contents: contents,
      systemInstruction: systemInstruction,
    });

    return response.response.text() || "";
  } catch (error) {
    console.error("Rubric Extraction Error:", error);
    throw new Error("Failed to extract rubric criteria from file.");
  }
};

export const extractAndClassifyQuestions = async (
  input: string | FileInput,
  rubric: Rubric
): Promise<Omit<Example, 'id'>[]> => {
  const systemInstruction = `
    You are an expert Chemistry Educator and Curriculum Designer.
    Your task is to populate a training dataset for an AI evaluator.
    The user will provide a document (text or file) containing chemistry questions.
    
    You must:
    1. Extract ALL distinct chemistry questions found in the content.
    2. Evaluate each question against the provided Rubric Criteria.
    3. Classify each question as "Higher Order" (meets criteria) or "Lower Order" (does not meet criteria).
    4. Provide a simplified, one-sentence reasoning (explanation) for your classification. 
       - For "Higher Order", explain why it's a good example (e.g., "Requires experimental design and error analysis").
       - For "Lower Order", explain why it's a bad example (e.g., "Simple recall of factual knowledge").
    
    Rubric Criteria:
    ${rubric.criteria}
    
    Language Rule: 
    - Preserve the original language of the question (English/Simplified Chinese/Traditional Chinese). 
    - Write the explanation in the same language/script as the question.
    - If the question is Traditional Chinese, the explanation MUST be Traditional Chinese.
  `;

  const isFile = typeof input !== 'string';
  const textPrompt = isFile 
    ? "Please extract and classify all chemistry questions from this file."
    : `Please extract and classify all chemistry questions from this text:\n\n${input}`;

  const contents = isFile 
    ? { parts: [(input as FileInput).inlineData, { text: textPrompt }] }
    : { parts: [{ text: textPrompt }] };

  try {
    const response = await model.generateContent({
      contents: contents,
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING, description: "The text of the question" },
              type: { type: Type.STRING, enum: ["Higher Order", "Lower Order"], description: "The classification" },
              explanation: { type: Type.STRING, description: "A simplified reasoning for the classification" }
            },
            required: ["content", "type", "explanation"]
          }
        },
      },
    });

    const text = response.response.text();
    if (!text) return [];
    
    return JSON.parse(text) as Omit<Example, 'id'>[];
  } catch (error) {
    console.error("Batch Extraction Error:", error);
    throw new Error("Failed to extract and classify questions.");
  }
};

export const analyzeQuestion = async (
  input: string | FileInput, 
  rubric: Rubric,
  examples: Example[]
): Promise<AnalysisResult> => {
  
  // Format examples for the prompt
  const formattedExamples = examples.map(ex => `
    Example Question: "${ex.content}"
    Classification: ${ex.type}
    Reasoning: ${ex.explanation}
  `).join('\n\n');

  const systemInstruction = `
    You are an expert Chemistry Educator and Curriculum Designer specializing in Higher Order Thinking (HOT) Skills.
    Your task is to evaluate a given chemistry question (provided as text or within a document) against a specific rubric.
    
    CRITICAL: You must use the following User-Provided Examples to guide your standard for what constitutes "Higher Order" vs "Lower Order".
    Align your evaluation logic with these examples:
    
    ${formattedExamples}

    If a document is provided:
    1. Read the document and identify the main chemistry question(s) presented. 
    2. If multiple questions are present, select the one that attempts to be the most complex or open-ended.
    3. Quote the identified question in the 'analyzedContent' field.
    
    LANGUAGE INSTRUCTIONS:
    1. Detect the language of the analyzed question.
    2. If the question is in Simplified Chinese, ALL textual feedback (feedback, improvementSuggestions, betterQuestionExample, bloomLevel) MUST be provided in Simplified Chinese.
    3. If the question is in Traditional Chinese (繁體中文), ALL textual feedback MUST be provided in Traditional Chinese.
    4. If the question is in English, use English.
    
    You must provide:
    1. A boolean indicating if it is considered Higher Order.
    2. The estimated Bloom's Taxonomy level (e.g., "Evaluate", "Create", "Analyze" or Chinese equivalents like "評價", "創造", "分析").
    3. A score from 0 to 10 based on the rubric.
    4. Constructive feedback explaining why it received that score (in the question's language/script).
    5. A list of specific suggestions to make it more thought-provoking (in the question's language/script).
    6. A rewritten version of the question that transforms it into a strong Higher Order Thinking question (in the question's language/script).
    7. The exact text of the question you analyzed.
  `;

  const isFile = typeof input !== 'string';
  
  const textPrompt = `
    Analyze the chemistry question based on this rubric:
    
    Rubric Criteria:
    ${rubric.criteria}

    ${isFile ? 'Please locate the chemistry question in the attached file and analyze it.' : `Question to Analyze:\n"${input}"`}
  `;

  const contents = isFile 
    ? { parts: [(input as FileInput).inlineData, { text: textPrompt }] }
    : { parts: [{ text: textPrompt + `\n\nQuestion:\n${input}` }] };

  try {
    const response = await model.generateContent({
      contents: contents,
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isHigherOrder: { 
              type: Type.BOOLEAN,
              description: "True if the question is Analysis level or above."
            },
            bloomLevel: { 
              type: Type.STRING,
              description: "The Bloom's taxonomy level."
            },
            score: { 
              type: Type.INTEGER,
              description: "Score from 0 to 10"
            },
            feedback: { 
              type: Type.STRING,
              description: "Detailed critique of the question in the same language/script as the question."
            },
            improvementSuggestions: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 bullet points on how to improve the question in the same language/script as the question."
            },
            betterQuestionExample: { 
              type: Type.STRING,
              description: "A rewritten version of the question that is significantly better."
            },
            analyzedContent: {
              type: Type.STRING,
              description: "The exact text of the question identified and analyzed from the input."
            }
          },
          required: ["isHigherOrder", "bloomLevel", "score", "feedback", "improvementSuggestions", "betterQuestionExample", "analyzedContent"],
        },
      },
    });

    const text = response.response.text();
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the question. Please try again.");
  }
};
