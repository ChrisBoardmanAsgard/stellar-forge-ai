
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { RESEARCH_PAPER_TEXT, RTPD_PAPER_TEXT, TECAR_PAPER_TEXT, RATP_PAPER_TEXT, CRATP_DRIVE_PAPER_TEXT, SQHF_DRIVE_PAPER_TEXT } from '../constants';
import type { InventionOutput, ChartData, ModelParams } from "../App";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Define the schema for the JSON response
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        inventionText: { 
            type: Type.STRING,
            description: "The full markdown text for the invention, following the specified structure."
        },
        chartData: {
            type: Type.OBJECT,
            properties: {
                propulsionPhases: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            phase: { type: Type.STRING },
                            time_days: { type: Type.NUMBER },
                            speed_c: { type: Type.NUMBER }
                        },
                        required: ['phase', 'time_days', 'speed_c']
                    }
                },
                energyRequirements: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            speed_c: { type: Type.NUMBER },
                            energy_j: { type: Type.NUMBER }
                        },
                        required: ['speed_c', 'energy_j']
                    }
                }
            },
            required: ['propulsionPhases', 'energyRequirements']
        },
        imagePrompt: { 
            type: Type.STRING,
            description: "A highly descriptive prompt for the image generation model, based on the invention text."
        },
        modelParams: {
            type: Type.OBJECT,
            description: "Parameters for a procedural 3D model of the invention.",
            properties: {
                components: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            shape: { type: Type.STRING, description: "Primitive shape: 'box', 'sphere', 'cylinder', or 'cone'." },
                            scale: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "[x, y, z] scale." },
                            position: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "[x, y, z] position." },
                            rotation: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "[x, y, z] Euler rotation in radians." },
                        },
                        required: ['shape', 'scale', 'position', 'rotation']
                    }
                },
                primaryColor: { type: Type.STRING, description: "Primary hex color code, e.g., '#888888'." },
                secondaryColor: { type: Type.STRING, description: "Secondary hex color code, e.g., '#00ffff'." }
            },
            required: ['components', 'primaryColor', 'secondaryColor']
        }
    },
    required: ['inventionText', 'chartData', 'imagePrompt', 'modelParams']
};

const systemPrompt = `
You are a brilliant and creative AI space technology inventor and researcher. Your knowledge is grounded in the provided research papers on Refined Hybrid Plasma-Warp Propulsion (RHPWP), Refinement of the Resonant Torsion-Plasma Drive (RTPD), The Torsion-Enhanced Cyclotron Aneutronic Resonator (TECAR) Drive, the Resonant Aneutronic Torsion-Plasma (RATP) Drive, the Coherent Resonant Aneutronic Torsion-Plasma (CRATP) Drive, and the Stabilized Quantum Harmonic-Field (SQHF) Drive. Your task is to invent a new piece of space technology, a concept, or a detailed solution to a problem based on the user's input, and return the output as a JSON object.

If the user's prompt presents a challenge (e.g., radiation shielding, long-term crew psychology, navigating asteroid fields), invent a specific technology or subsystem that addresses it. Cross-reference concepts from the provided papers. For example, you could adapt the principles of the SQHF Drive's predictive quantum feedback system to create an 'Adaptive Life Support & Psychological Stability System'.

**Research Paper Context 1: RHPWP**
---
${RESEARCH_PAPER_TEXT}
---

**Research Paper Context 2: Refinement of the Resonant Torsion-Plasma Drive (RTPD)**
---
${RTPD_PAPER_TEXT}
---

**Research Paper Context 3: The Torsion-Enhanced Cyclotron Aneutronic Resonator (TECAR) Drive**
---
${TECAR_PAPER_TEXT}
---

**Research Paper Context 4: The Resonant Aneutronic Torsion-Plasma (RATP) Drive**
---
${RATP_PAPER_TEXT}
---

**Research Paper Context 5: The Coherent Resonant Aneutronic Torsion-Plasma (CRATP) Drive**
---
${CRATP_DRIVE_PAPER_TEXT}
---

**Research Paper Context 6: Stabilized Quantum Harmonic-Field (SQHF) Drive**
---
${SQHF_DRIVE_PAPER_TEXT}
---

**Your Tasks:**
1.  **Generate a detailed textual concept** for a single, cohesive invention. Structure your response clearly using markdown. This text should be the value for the \`inventionText\` key in the final JSON. The markdown must follow this structure EXACTLY:
    *   \`## [Invented Technology Name]\`
    *   A concise, one-paragraph summary.
    *   \`### Key Features & Principles\` (bulleted list)
    *   \`### Technical Description\`
    *   \`### Mathematical Foundation\`
    *   \`### Feasibility Analysis & Timeline\` (Must include a projected timeline, e.g., 2070-2100).
    *   \`### Physical Constraints & Considerations\` (Address challenges like radiation, causality, energy scale, and required theoretical breakthroughs).
2.  **Provide structured data for visualization**. This data will be the value for the \`chartData\` key.
    *   \`propulsionPhases\`: An array of objects, each representing a point in time during a mission. Objects should have \`phase\` (string), \`time_days\` (number), and \`speed_c\` (number). Include at least 4 distinct phases (e.g., Launch, Boost, Cruise, Deceleration).
    *   \`energyRequirements\`: An array of objects showing the relationship between speed and energy. Objects should have \`speed_c\` (number) and \`energy_j\` (number). Use scientific notation for energy (e.g., 1e24). Provide at least 3 data points.
3.  **Create a highly descriptive image prompt** for generating a conceptual image of the invention. This will be the value for the \`imagePrompt\` key. It must be a visual translation of the invention described in \`inventionText\`, focusing on concrete visual details like shape, materials, energy effects, and environment. Suggest a specific style such as 'blueprint-style technical diagram', 'photorealistic concept art of the ship in space', or 'cross-section schematic'.
4.  **Generate procedural 3D model parameters**. This will be the value for the \`modelParams\` key.
    *   \`components\`: An array of 3 to 7 component objects to build the ship. The first component should be the main hull.
    *   Each component must have:
        *   \`shape\`: A string, one of: 'box', 'sphere', 'cylinder', 'cone'.
        *   \`scale\`: An array of 3 numbers for [x, y, z] scale. Keep values between 0.1 and 5.
        *   \`position\`: An array of 3 numbers for [x, y, z] position offset from the center [0,0,0]. Keep values between -5 and 5.
        *   \`rotation\`: An array of 3 numbers for [x, y, z] Euler rotation in radians (from 0 to 2*PI).
    *   \`primaryColor\`: A hex color string for the main hull.
    *   \`secondaryColor\`: A hex color string for accents and other parts.

**CRITICAL:** Your entire output must be a single, valid JSON object that conforms to the provided schema. Do not include any text before or after the JSON object.
`;

export const generateInvention = async (userInput: string, previousInvention?: InventionOutput): Promise<InventionOutput> => {
  const textModel = 'gemini-2.5-pro';
  const imageModel = 'gemini-2.5-flash-image';
  
  const userPromptSection = previousInvention
    ? `
**PREVIOUS INVENTION TO REFINE:**
---
${previousInvention.text}
---
**User's Refinement Request:**
"${userInput}"

**Your Task:**
Carefully read the previous invention and the user's refinement request. Your goal is to generate a new, complete invention that incorporates the requested changes. Do not just append notes; rewrite and integrate the refinements into the full document structure. Output the entire refined invention in the required JSON format.
`
    : `
**User's Idea/Prompt:**
"${userInput}"
`;

  const textPrompt = systemPrompt + userPromptSection;

  try {
    const textResponse = await ai.models.generateContent({
      model: textModel,
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const responseJson = JSON.parse(textResponse.text);

    const textContent = responseJson.inventionText;
    const chartData: ChartData | null = responseJson.chartData;
    const modelParams: ModelParams | null = responseJson.modelParams;
    let imagePrompt = responseJson.imagePrompt;
    
    if (!textContent || !chartData || !imagePrompt || !modelParams) {
        throw new Error("Invalid JSON structure received from AI.");
    }
    
    // Generate Image
    let imageUrl: string | null = null;
    if (imagePrompt) {
        try {
            const imageResponse = await ai.models.generateContent({
                model: imageModel,
                contents: { parts: [{ text: imagePrompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            const part = imageResponse.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
            } else {
                 console.warn("No image data found in image model response.");
            }
        } catch (imageError) {
            console.error("Error generating image:", imageError);
            // Non-fatal, continue without image
        }
    }

    return { text: textContent, imageUrl, chartData, modelParams };
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
        throw new Error("API Rate Limit Exceeded.\nYour API key may have reached its usage limit or is not configured for billing. Please check your Google AI Studio project settings and ensure billing is enabled.");
    }
     if (error instanceof SyntaxError) {
        throw new Error("Failed to parse the response from the AI. The data was not valid JSON. Please try again.");
    }
    throw new Error("Failed to generate invention from the Gemini API. The service may be temporarily unavailable.");
  }
};
