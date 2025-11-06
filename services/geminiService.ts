import { GoogleGenAI, Modality, Part } from "@google/genai";
import { NAIL_DO_STYLES } from '../constants';
import { fileToBase64 } from '../utils/fileUtils';

export const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64Data = await fileToBase64(file);
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};

export const enhancePrompt = async (apiKey: string, image: File | null, text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `You are a world-class nail art prompt engineer. Your goal is to create a detailed, vivid prompt for an AI image generator. The output image must be a realistic photo of both of a Kenyan woman's hands on a fluffy and furry square pillow, taken under the shine of a ring light. The photo should look like realistic phone photography, possibly with some light grain, not a glossy, hyper-realistic AI render.

Analyze the user's request, which may include a reference image and/or a text description.

First, identify the core nail style from the user's input by cross-referencing with this provided nail style information:
${NAIL_DO_STYLES}

Once you identify the style, build a new, enhanced prompt.
- Describe the model's hands, including skin complexion (e.g., deep ebony, rich cocoa), and finger characteristics (e.g., slender, long, short, chubby).
- If the user provided a prompt, refine it and add more detail, but you MUST keep the core nail style they described.
- If the user only provided an image, describe the image in detail, including the identified nail style, shape, length, color, finish, and any art or embellishments.
- The final prompt MUST be a single paragraph of text. Do NOT include any other explanations, headings, or markdown formatting.
- The prompt MUST include phrases like "shot on a smartphone," "natural lighting from a ring light," "subtle film grain," "realistic photo," "soft shadows," to guide the image style.
- The prompt MUST specify the background is a "fluffy and furry white square pillow".
`;

  const parts: Part[] = [];
  if (image) {
    parts.push(await fileToGenerativePart(image));
  }
  parts.push({ text: `User's current prompt is: "${text || 'No prompt provided.'}" Based on the context, create or enhance the prompt.` });

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: { systemInstruction },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    throw new Error("Could not enhance the prompt with Gemini.");
  }
};

const generateSingleImage = async (apiKey: string, parts: Part[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash-image';
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const candidate = response.candidates?.[0];

        // Robustly check for the presence of image data before accessing it
        if (candidate && candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        // If we reach here, no image was found or the response was invalid/blocked.
        const finishReason = candidate?.finishReason;
        const safetyRatings = JSON.stringify(candidate?.safetyRatings, null, 2);
        const errorMessage = `Image generation failed. The API did not return an image. Finish Reason: ${finishReason}.`;
        console.error(errorMessage, `Safety Ratings: ${safetyRatings}`);
        throw new Error(errorMessage);

    } catch (error) {
        console.error("Error during single image generation:", error);
        // Re-throw the original error to be caught by the calling function.
        throw new Error("Failed to generate a single image.");
    }
}


export const generateInitialImage = async (apiKey: string, prompt: string, referenceImage: File | null): Promise<string> => {
    const parts: Part[] = [{ text: prompt }];
    if (referenceImage) {
        parts.unshift(await fileToGenerativePart(referenceImage));
    }
    return generateSingleImage(apiKey, parts);
};

export const editImage = async (apiKey: string, prompt: string, imageToEdit: Part, referenceImage: File | null): Promise<string> => {
    const parts: Part[] = [imageToEdit, { text: prompt }];
     if (referenceImage) {
        // If there's a new reference image, it should probably take precedence
        parts.unshift(await fileToGenerativePart(referenceImage));
    }
    return generateSingleImage(apiKey, parts);
};

// Array of specific pose prompts to ensure true variation
const posePrompts = [
    "hands gently cupped together, as if holding something precious, with a slightly overhead camera angle.",
    "one hand resting flat, palm down, while the other hand is gracefully placed on top of it, focusing on the top hand's nails.",
    "the back of both hands, with fingers slightly curled and relaxed, side-by-side.",
    "a close-up of the hands with fingers intertwined, showcasing the nail art from a diagonal angle.",
    "both hands held up with palms facing forward, fingers slightly spread apart.",
    "a side view of both hands, held parallel to each other, with fingers extended.",
    "one hand making a soft fist, with the other hand resting gently on its side, focusing on the contrast in shapes.",
    "the hands crossed at the wrist, fingers relaxed and extended over the pillow.",
    "a close-up shot focusing on the thumbs, with the other fingers softly blurred in the background.",
    "one hand laid flat and the other perpendicular to it, resting its side on the first hand's palm.",
];

export const generateImageVariations = async (apiKey: string, masterImage: Part, count: number): Promise<string[]> => {
    const variations: string[] = [];
    
    for (let i = 0; i < count; i++) {
        // Cycle through the pose prompts using the modulo operator to ensure variety
        const specificPose = posePrompts[i % posePrompts.length];
        
        const prompt = `Generate a variation of this image which features two hands. It is extremely important that you DO NOT change the hand model, nail design, nail shape, colors, nail art, skin tone, finger shape, or any accessories. The background and lighting must also remain exactly the same. 
The ONLY things that should change are the camera angle and the pose of both hands. 
The new pose should be: **${specificPose}**
Ensure the new image is not identical to the original.`;

        try {
            console.log(`Generating variation ${i + 1} with pose: ${specificPose}`);
            const imageB64 = await generateSingleImage(apiKey, [masterImage, { text: prompt }]);
            variations.push(imageB64);
            // Add a delay to avoid hitting rate limits
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            console.error(`Error generating variation ${i + 1}:`, error);
            // Stop the process and inform the user if a single variation fails
            throw new Error(`Failed to generate variation ${i + 1}. Please try again.`);
        }
    }

    if (variations.length !== count) throw new Error("Could not generate all the requested image variations.");
    return variations;
}


export const generateCaption = async (apiKey: string, promptForImages: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';
    const systemInstruction = `You are a fun, bubbly social media manager for a trendy nail salon called "Sparkles Nail Loft".
Your tone is casual, human, and genuinely excited, not overly verbose or descriptive.
Analyze the provided description of a nail set.
Based on the description, create a social media caption.
The caption MUST strictly follow this template, in this exact order, with no extra text or labels:
1. A short, catchy, and human-sounding sentence celebrating the nail design. For example, instead of "Obsessed is an understatement for these stunning coffin nails...", say something more direct like "Obsessing over these little hearts!".
2. A Call to Action (CTA), for example: "DM us to book your new set! ✨"
3. The business contact info: "📍 Sparkles Nail Loft | 📞 555-123-4567"
4. A list of exactly 15 relevant keywords describing the style, color, and technique, separated by commas.
5. A list of exactly 5 relevant hashtags, each starting with #.

Each of these 5 points must be on a new line.`;

  try {
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: `The nail design is described as: "${promptForImages}". Generate the caption for a social media post featuring images of these nails.` }] },
        config: { systemInstruction },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating caption:", error);
    throw new Error("Could not generate a caption with Gemini.");
  }
};