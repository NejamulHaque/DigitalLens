"use client";
import { motion } from "framer-motion";
import { FiExternalLink } from "react-icons/fi";

const projects = [
  {
    title: "Irus AI",
    description: "Personal AI command center with web search, document AI, image generation, and voice mode.",
    url: "https://irus-ai.onrender.com/",
    gradient: "from-purple-600 to-blue-600",
  },
  {
    title: "CollabSheets",
    description: "A real-time collaborative workspace combining code editor, documents, slides, spreadsheets, whiteboard, video calls, and team chat — all in one browser tab.",
    url: "https://collabsheets.onrender.com/",
    gradient: "from-cyan-600 to-teal-600",
  },
  {
    title: "Nestfy",
    description: "A advance finance tracker with Irus AI integration, providing real-time insights and personalized recommendations for smarter financial decisions.",
    url: "https://nestfy-beta.vercel.app/",
    gradient: "from-orange-600 to-red-600",
  },
  {
    title: "Portfolio Builder",
    description: "Create your own professional portfolio website in minutes using this AI-powered Portfolio Builder.",
    url: "https://builderr-ai.vercel.app/",
    gradient: "from-pink-600 to-rose-600",
  },
  {
    title: "Resume Builder",
    description: "Create your own professional resume in minutes using this AI-powered Resume Builder.",
    url: "https://proresume-six.vercel.app/",
    gradient: "from-pink-600 to-rose-600",
  },
  {
    title: "Open Source Contributer",
    description: "Contribute to open-source projects and showcase my skills.",
    url: "https://github.com/NejamulHaque",
    gradient: "from-pink-600 to-rose-600",
  },
];

export default function OtherServices() {
  return (
    <section className="py-32 bg-gradient-to-b from-slate-950 to-slate-900" id="projects">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            My{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Portfolio
            </span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Explore all my AI-powered projects and experiments.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.a
              key={project.title}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <div className={`h-2 bg-gradient-to-r ${project.gradient}`} />
              <div className="p-8 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">{project.title}</h3>
                  <FiExternalLink className="w-6 h-6 text-white/40 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </div>
                <p className="text-white/60 leading-relaxed">{project.description}</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none"
                   style={{ background: `linear-gradient(135deg, ${project.gradient})` }} />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}