// --- CONFIGURATION AND CONSTANTS ---

// gemini-2.5-flash-preview-09-2025 supports multimodal input (text and image)
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025'; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
const apiKey = "AIzaSyDdOkFYez625UjfgfOSefxA4JGdmLg_PXQ"; // API key is handled by the environment

// Define the structured JSON schema for the AI output
const RESUME_SCHEMA = {
    type: "OBJECT",
    properties: {
        parsedData: {
            type: "OBJECT",
            properties: {
                name: { "type": "STRING", "description": "Full name of the applicant." },
                title: { "type": "STRING", "description": "Current or desired professional title." },
                contact: {
                    type: "OBJECT",
                    properties: {
                        phone: { "type": "STRING" },
                        email: { "type": "STRING" },
                        linkedin: { "type": "STRING", "description": "LinkedIn profile URL or handle." }
                    }
                },
                summary: { "type": "STRING", "description": "A concise, 3-4 sentence professional summary." },
                experience: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            title: { "type": "STRING" },
                            company: { "type": "STRING" },
                            dates: { "type": "STRING", "description": "e.g., 'Jan 2020 - Dec 2023' or '2020 - Present'" },
                            description: { "type": "STRING", "description": "A 2-3 line summary of key achievement or responsibility." }
                        }
                    }
                },
                education: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            degree: { "type": "STRING" },
                            institution: { "type": "STRING" },
                            dates: { "type": "STRING", "description": "e.g., '2015 - 2019'" }
                        }
                    }
                },
                skills: { "type": "ARRAY", items: { "type": "STRING" }, "description": "List of 5-10 core technical and soft skills." }
            },
            propertyOrdering: ["name", "title", "contact", "summary", "experience", "education", "skills"]
        },
        templates: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    id: { "type": "STRING", "description": "A unique identifier: 'classic', 'modern', or 'tech'." },
                    name: { "type": "STRING", "description": "A catchy name for the template, e.g., 'The Clarity Standard'." },
                    description: { "type": "STRING", "description": "A brief, one-sentence description of who the template is best for (e.g., 'Best for finance and legal professionals.')." }
                }
            }
        }
    },
    propertyOrdering: ["parsedData", "templates"]
};

// --- DATA STRUCTURES ---

const TEMPLATE_DESIGNS = {
    classic: 'The Clarity Standard',
    modern: 'Modern Professional',
    tech: 'Tech Streamlined',
};

// Default empty data structure (used for initial load)
const DEFAULT_RESUME_DATA = {
    name: 'Jane Doe',
    title: 'Senior Product Manager',
    contact: { phone: '123-456-7890', email: 'jane.doe@example.com', linkedin: 'linkedin.com/in/janedoe' },
    summary: 'A highly motivated and results-oriented professional with 8+ years of experience in product development, agile methodologies, and cross-functional team leadership. Proven ability to drive product strategy from concept to launch.',
    experience: [
        { title: 'Product Manager', company: 'Innovate Solutions', dates: 'Jan 2020 - Present', description: 'Led the development of a flagship SaaS platform, resulting in a 40% increase in user retention. Managed a team of 5 engineers and 2 designers.' }
    ],
    education: [
        { degree: 'MBA in Business Administration', institution: 'State University', dates: '2014 - 2016' }
    ],
    skills: ['Agile/Scrum', 'Product Strategy', 'Figma', 'SQL', 'Market Analysis', 'Team Leadership']
};


// --- React/JSX Setup ---
const { useState, useEffect, useCallback, useMemo } = React;

// Icon Components (Simplified SVGs for compatibility)
const RefreshCcw = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-7.44 3.42" }), React.createElement("path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 7.44-3.42" }), React.createElement("path", { d: "M17.65 6.35L21 3M3 21l3.35-3.35" }));
const Send = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "m22 2-7 20-4-9-9-4Z" }), React.createElement("path", { d: "M22 2 11 13" }));
const Download = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), React.createElement("polyline", { points: "7 10 12 15 17 10" }), React.createElement("line", { x1: "12", x2: "12", y1: "15", y2: "3" }));
const Loader2 = ({ className }) => React.createElement("svg", { className: `${className} animate-spin`, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }));
const Edit = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" }));
const Printer = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("polyline", { points: "6 9 6 2 18 2 18 9" }), React.createElement("path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }), React.createElement("rect", { width: "12", height: "8", x: "6", y: "14" }));
const CheckCircle = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }), React.createElement("polyline", { points: "22 4 12 14.01 9 11.01" }));
const Smartphone = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("rect", { width: "14", height: "20", x: "5", y: "2", rx: "2", ry: "2" }), React.createElement("path", { d: "M12 18h.01" }));
const Mail = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }), React.createElement("polyline", { points: "22,6 12,13 2,6" }));
const Globe = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("path", { d: "M12 2a15.3 15.3 0 0 0 4 10 15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0-4-10 15.3 15.3 0 0 0 4-10zM2.05 9h19.9" }));
const Briefcase = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("rect", { width: "20", height: "14", x: "2", y: "7", rx: "2", ry: "2" }), React.createElement("path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" }));
const GraduationCap = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M22 10v6m-2-4v6m-2-4v6M5 17l5-3 5 3" }), React.createElement("path", { d: "M12 3a7 7 0 0 0-7 7v6a7 7 0 0 0 7 7 7 7 0 0 0 7-7v-6a7 7 0 0 0-7-7z" }));
const Zap = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }));
const UploadCloud = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9" }), React.createElement("path", { d: "m16 16-4-4-4 4" }));
const FileText = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }), React.createElement("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }), React.createElement("path", { d: "M10 9H8" }), React.createElement("path", { d: "M16 13H8" }), React.createElement("path", { d: "M16 17H8" }));
const ImageIcon = ({ className }) => React.createElement("svg", { className: className, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }), React.createElement("circle", { cx: "9", cy: "9", r: "2" }), React.createElement("path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }));


// --- RESUME TEMPLATES (COMPONENTS) ---

const SectionHeader = ({ icon: Icon, title, isDark = false }) => (
    React.createElement("div", { className: `flex items-center space-x-2 pb-1 mb-2 ${isDark ? 'border-b-2 border-white/50 text-white' : 'border-b-2 border-slate-300 text-slate-700'}` }, 
        React.createElement(Icon, { className: "w-5 h-5" }), 
        React.createElement("h2", { className: "text-xl font-bold tracking-wider uppercase" }, title)
    )
);

// Template 1: Classic (Single Column, Serif-inspired)
const ClassicTemplate = ({ data }) => (
    React.createElement("div", { className: "resume p-6 max-w-4xl mx-auto shadow-2xl bg-white font-serif text-slate-800 printable", style: { minHeight: '297mm' } }, 
        React.createElement("header", { className: "text-center mb-6" }, 
            React.createElement("h1", { className: "text-4xl font-extrabold text-slate-900 mb-1" }, data.name), 
            React.createElement("h2", { className: "text-xl font-medium text-slate-600 mb-3" }, data.title), 
            React.createElement("div", { className: "flex justify-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600" }, 
                React.createElement("span", null, React.createElement(Smartphone, { className: "inline w-3 h-3 mr-1" }), data.contact.phone), 
                React.createElement("span", null, React.createElement(Mail, { className: "inline w-3 h-3 mr-1" }), data.contact.email), 
                React.createElement("span", null, React.createElement(Globe, { className: "inline w-3 h-3 mr-1" }), data.contact.linkedin)
            )
        ), 

        React.createElement("section", { className: "mb-6" }, 
            React.createElement(SectionHeader, { icon: Zap, title: "Professional Summary" }), 
            React.createElement("p", { className: "text-sm leading-relaxed italic" }, data.summary)
        ), 

        React.createElement("section", { className: "mb-6" }, 
            React.createElement(SectionHeader, { icon: Briefcase, title: "Experience" }), 
            data.experience.map((job, index) => (
                React.createElement("div", { key: index, className: "mb-3 pl-1" }, 
                    React.createElement("div", { className: "flex justify-between items-baseline" }, 
                        React.createElement("h3", { className: "text-md font-bold" }, job.title), 
                        React.createElement("span", { className: "text-sm font-medium text-slate-500" }, job.dates)
                    ), 
                    React.createElement("p", { className: "text-sm italic text-slate-600 mb-1" }, job.company), 
                    React.createElement("p", { className: "text-sm" }, job.description)
                )
            ))
        ), 

        React.createElement("div", { className: "flex space-x-6" }, 
            React.createElement("section", { className: "w-2/3" }, 
                React.createElement(SectionHeader, { icon: GraduationCap, title: "Education" }), 
                data.education.map((edu, index) => (
                    React.createElement("div", { key: index, className: "mb-3 pl-1" }, 
                        React.createElement("div", { className: "flex justify-between items-baseline" }, 
                            React.createElement("h3", { className: "text-md font-bold" }, edu.degree), 
                            React.createElement("span", { className: "text-sm font-medium text-slate-500" }, edu.dates)
                        ), 
                        React.createElement("p", { className: "text-sm italic text-slate-600" }, edu.institution)
                    )
                ))
            ), 
            React.createElement("section", { className: "w-1/3" }, 
                React.createElement(SectionHeader, { icon: CheckCircle, title: "Skills" }), 
                React.createElement("ul", { className: "text-sm space-y-1 list-disc list-inside" }, 
                    data.skills.map((skill, index) => (
                        React.createElement("li", { key: index, className: "ml-2" }, skill)
                    ))
                )
            )
        )
    )
);

// Template 2: Modern (Two Column, Sans-Serif, Highlighted Sidebar)
const ModernTemplate = ({ data }) => (
    React.createElement("div", { className: "resume p-0 max-w-4xl mx-auto shadow-2xl bg-white font-sans text-slate-800 flex printable", style: { minHeight: '297mm' } }, 
        /* Sidebar */
        React.createElement("div", { className: "w-1/3 p-6 bg-slate-800 text-white rounded-l-lg space-y-6" }, 
            React.createElement("header", { className: "text-center pb-4 border-b border-white/30" }, 
                React.createElement("h1", { className: "text-3xl font-extrabold mb-1" }, data.name.toUpperCase()), 
                React.createElement("p", { className: "text-lg font-light text-cyan-300" }, data.title)
            ), 

            React.createElement("section", null, 
                React.createElement(SectionHeader, { icon: Smartphone, title: "Contact", isDark: true }), 
                React.createElement("ul", { className: "text-sm space-y-2 font-light" }, 
                    React.createElement("li", { className: "flex items-center space-x-2" }, React.createElement(Mail, { className: "w-4 h-4 text-cyan-300" }), React.createElement("span", null, data.contact.email)), 
                    React.createElement("li", { className: "flex items-center space-x-2" }, React.createElement(Smartphone, { className: "w-4 h-4 text-cyan-300" }), React.createElement("span", null, data.contact.phone)), 
                    React.createElement("li", { className: "flex items-center space-x-2" }, React.createElement(Globe, { className: "w-4 h-4 text-cyan-300" }), React.createElement("span", null, data.contact.linkedin))
                )
            ), 

            React.createElement("section", null, 
                React.createElement(SectionHeader, { icon: CheckCircle, title: "Skills", isDark: true }), 
                React.createElement("ul", { className: "text-sm space-y-1 font-light" }, 
                    data.skills.map((skill, index) => (
                        React.createElement("li", { key: index, className: "text-gray-300" }, "▹ ", skill)
                    ))
                )
            ), 

            React.createElement("section", null, 
                React.createElement(SectionHeader, { icon: GraduationCap, title: "Education", isDark: true }), 
                data.education.map((edu, index) => (
                    React.createElement("div", { key: index, className: "mb-3" }, 
                        React.createElement("p", { className: "font-semibold text-base text-cyan-300" }, edu.degree), 
                        React.createElement("p", { className: "text-sm text-white/80" }, edu.institution), 
                        React.createElement("p", { className: "text-xs text-white/50" }, edu.dates)
                    )
                ))
            )
        ), 

        /* Main Content */
        React.createElement("div", { className: "w-2/3 p-6 space-y-6" }, 
            React.createElement("section", null, 
                React.createElement(SectionHeader, { icon: Zap, title: "Summary" }), 
                React.createElement("p", { className: "text-base text-gray-700" }, data.summary)
            ), 

            React.createElement("section", null, 
                React.createElement("h2", { className: "text-xl font-bold mb-3 uppercase border-b border-slate-300 text-slate-700 flex items-center" }, React.createElement(Briefcase, { className: "w-5 h-5 mr-2" }), "Professional Experience"), 
                data.experience.map((job, index) => (
                    React.createElement("div", { key: index, className: "mb-4" }, 
                        React.createElement("div", { className: "flex justify-between items-start" }, 
                            React.createElement("h3", { className: "text-lg font-bold text-slate-900" }, job.title, " ", React.createElement("span", { className: "text-base font-semibold text-cyan-600" }, "| ", job.company)), 
                            React.createElement("span", { className: "text
