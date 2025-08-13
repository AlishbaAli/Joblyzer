import { prepareInstructions, AIResponseFormat } from "../../constants";
import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

const upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };
  const handleAnalyzer = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File | null;
  }) => {
    setIsProcessing(true);
    setStatusText("Analyzing Resume...");
    if (!file) return;
    const uploadFile = await fs.upload([file]);
    if (!uploadFile) return setStatusText("Failed to upload file");
    setStatusText("Converting to image...");
    const imageFile = await convertPdfToImage(file);
    if (!imageFile.file) return setStatusText("Failed to convert to image");
    setStatusText("Uploading image...");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText("Failed to upload image");
    setStatusText("Preparing data...");
    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumePath: uploadFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: "",
    };
    await kv.set(uuid, JSON.stringify(data));
    setStatusText("Analyzing Resume...");
    const feedback = await ai.feedback(
      uploadedImage.path,
      prepareInstructions({
        jobTitle,
        jobDescription,
        AIResponseFormat,
      })
    );
    if (!feedback) return setStatusText("Failed to get feedback");

    let feedbackText: string;
    if (typeof feedback.message.content === "string") {
      feedbackText = feedback.message.content;
    } else if (
      Array.isArray(feedback.message.content) &&
      feedback.message.content[0]?.text
    ) {
      feedbackText = feedback.message.content[0].text;
    } else {
      return setStatusText("Invalid feedback format received");
    }

    try {
      data.feedback = JSON.parse(feedbackText);
    } catch (error) {
      return setStatusText("Failed to parse feedback data");
    }

    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText("Analysis complete! Redirecting...");
    console.log(data);
    // Navigate to results page
  };
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;
    if (!file) return;
    handleAnalyzer({
      companyName,
      jobTitle,
      jobDescription,
      file,
    });
  };
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section py-16">
        <div className="page-heading py-16">
          <h1>Upgrade your resume with AI-driven tips.</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full"></img>
            </>
          ) : (
            <h2> Drop your Resume for improvement </h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                ></input>
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job title"
                  id="job-title"
                ></input>
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                ></textarea>
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  selectedFile={file}
                />
              </div>
              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default upload;
