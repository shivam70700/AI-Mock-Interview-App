import useSpeechToText, { type ResultType } from 'react-hook-speech-to-text';
import { useEffect, useState } from 'react';
import { CircleStop, Loader, Mic, RefreshCw, Save, Video, VideoOff, WebcamIcon } from 'lucide-react';
import Webcam from 'react-webcam';
import { TooltipButton } from './tooltip_button';
import { toast } from 'sonner';
import { chatSession } from '@/scripts';
import SaveModel from './save_model';


interface RecordAnswerProps {
    question: { question: string; answer: string };
    isWebCam: boolean;
    setIsWebCam: (value: boolean) => void;
}

// Response from AI
interface AIResponse {
    ratings: number;
    feedback: string;
}



const RecordAnswer = ({
    question,
    isWebCam,
    setIsWebCam,
}: RecordAnswerProps) => {
    const {
        interimResult,
        isRecording,
        results,
        startSpeechToText,
        stopSpeechToText,
    } = useSpeechToText({
        continuous: true,
        useLegacyResults: false
    });

    const [userAnswer, setUserAnswer] = useState("");
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [aiResult, setAiResult] = useState<AIResponse | null>(null);
    const [open, setOpen] = useState(false);
    const [loading] = useState(false);

    // Clear Response

    const cleanAiResponse = (data: string) => {
        //  Trim any surrounding whitespace
        let result = data.trim();

        //  Remove any occurrences of "json" or code block symbols (``` or `)
        result = result.replace(/(json|```|`)/g, "");


        // Parse the clean JSON text into an array of objects
        try {
            return JSON.parse(result);
        } catch (error) {
            throw new Error("Invalid JSON format: " + (error as Error)?.message);
        }
    }


    const RecorderedAnswer = async () => {
        //  console.log(isRecording);
        if (isRecording) {
            stopSpeechToText();
            if (userAnswer?.length < 30) {
                toast.error("Error", {
                    description: "Your answer should be more than 30 characters",
                });
                return;
            }

            // AI Result
            const aiResult = await generateResult(
                question.question,
                question.answer,
                userAnswer
            );
            // console.log(aiResult);
            setAiResult(aiResult);
        }
        else {
            startSpeechToText();
        }
    }


    const generateResult = async (qst: string,
        qstAns: string,
        userAns: string): Promise<AIResponse> => {
        setIsAiGenerating(true);
        const prompt = `
      Question: "${qst}"
      User Answer: "${userAns}"
      Correct Answer: "${qstAns}"
      Please compare the user's answer to the correct answer, and provide a rating (from 1 to 10) based on answer quality, and offer feedback for improvement.
      Return the result in JSON format with the fields "ratings" (number) and "feedback" (string).
    `;

        try {
            const aiResult = await chatSession.sendMessage(prompt);
            const parsedResult: AIResponse = cleanAiResponse(aiResult.response.text());
            return parsedResult;

        } catch (error) {
            console.log(error);
            toast("Error", { description: "An error occurred while generating feedback." })
            return { ratings: 0, feedback: "Unable to generate feedback" };
        } finally {
            setIsAiGenerating(false);
        }

    }

    const RecordedNewAnswer = () => {
        setUserAnswer("");
        stopSpeechToText();
        startSpeechToText();
    }

    useEffect(() => {
        const combineTranscript = results.filter((result): result is ResultType => typeof result != "string")
            .map((result) => result.transcript).join(" ");

        setUserAnswer(combineTranscript);

    }, [results]);


    const SaveUserAnswer = () => {

    }


    return (
        <div className="w-full flex flex-col items-center gap-8 mt-4">
            {/* Save Model */}

            <SaveModel
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={SaveUserAnswer}
                loading={loading}
            />

            <div className="flex items-center justify-center w-full h-full">
                <div className="w-full h-[400px] md:w-96 flex flex-col items-center justify-center border p-4 bg-gray-50 rounded-md">
                    {isWebCam ? (
                        <Webcam
                            onUserMedia={() => setIsWebCam(true)}
                            onUserMediaError={() => setIsWebCam(false)}
                            className="w-full h-full object-cover rounded-md"
                        />
                    ) : (
                        <WebcamIcon className="min-w-24 min-h-24 text-muted-foreground" />
                    )}
                </div>
            </div>
            <div className="flex itece justify-center gap-3">
                <TooltipButton
                    content={isWebCam ? "Turn Off" : "Turn On"}
                    icon={
                        isWebCam ? (
                            <VideoOff className="min-w-5 min-h-5" />
                        ) : (
                            <Video className="min-w-5 min-h-5" />
                        )
                    }
                    onClick={() => setIsWebCam(!isWebCam)}
                />
                <TooltipButton
                    content={isRecording ? "Stop Recording" : "Start Recording"}
                    icon={
                        isRecording ? (
                            <CircleStop className="min-w-5 min-h-5" />
                        ) : (
                            <Mic className="min-w-5 min-h-5" />
                        )
                    }
                    onClick={RecorderedAnswer}
                />
                <TooltipButton
                    content="Record Again"
                    icon={<RefreshCw className="min-w-5 min-h-5" />}
                    onClick={RecordedNewAnswer}
                />
                <TooltipButton
                    content="Save Result"
                    icon={
                        isAiGenerating ? (
                            <Loader className="min-w-5 min-h-5 animate-spin" />
                        ) : (
                            <Save className="min-w-5 min-h-5" />
                        )
                    }
                    onClick={() => setOpen(!open)}
                    disabled={!aiResult}
                />
            </div>
            <div className="w-full mt-4 p-4 border rounded-md bg-gray-50">

                <h2 className="text-lg font-semibold">Your Answer:</h2>
                <p className="text-sm mt-2 text-gray-700 whitespace-normal">
                    {userAnswer || "Start recording to see your ansewer here"}
                </p>
                {interimResult && (
                    <p className="text-sm text-gray-500 mt-2">
                        <strong>Current Speech:</strong>
                        {interimResult}
                    </p>
                )}

            </div>
        </div>
    )
}

export default RecordAnswer
