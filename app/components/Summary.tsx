import React from "react";
import ScoreGuage from "./ScoreGuage";
import ScoreBadge from "./ScoreBadge";
const Category = ({ score, title }: { score: number; title: string }) => {
  const textXolor =
    score >= 70
      ? "text-green-600"
      : score > 49
      ? "text-yellow-600"
      : "text-red-600";
  return (
    <div className="resume-summary">
      <div className="category">
        <div className="flex flex-row gap-2 items-center justify-center">
          <p className="text-2xl">{title}</p>
          <ScoreBadge score={score} />
        </div>
        <p className="text-2xl">
          <span className={textXolor}> {score}</span>
        </p>
      </div>
    </div>
  );
};

const Summary = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
      <div className="flex flex-row items-center gap-8 p-4">
        <ScoreGuage score={feedback.overallScore} />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Overall Score</h2>
          <p className="text-gray-500">
            This is the overall score for your resume. It is based on the
            variables listed below.
          </p>
        </div>
      </div>
      <Category title={"Tone and Syle"} score={feedback.toneAndStyle.score} />
      <Category title={"Content"} score={feedback.content.score} />
      <Category title={"Structure"} score={feedback.structure.score} />
      <Category title={"Skils"} score={feedback.skills.score} />
    </div>
  );
};

export default Summary;
