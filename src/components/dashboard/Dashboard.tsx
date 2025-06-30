import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Navigation } from '../ui/Navigation';

// Design system tokens (from JSONB)
const COLORS = {
  navy: '#1a365d',
  orange: '#ed8936',
  coral: '#ff7a59',
  cream: '#fffbeb',
  offWhite: '#f7fafc',
  white: '#ffffff',
  darkGray: '#2d3748',
  mediumGray: '#718096',
  yellow: '#ecc94b',
};
const FONT = {
  primary: 'Inter, system-ui, -apple-system, sans-serif',
  secondary: 'Georgia, Times, serif',
};

export function Dashboard() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 font-sans">
      {/* Logo (top left) */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <img src="/logo.svg" alt="Raft Logo" className="h-9 w-9" />
        <span className="font-serif font-bold text-2xl text-primary-900 dark:text-primary-100">Raft</span>
      </div>
      {/* Main content grid */}
      <div className="relative grid grid-cols-[1fr_2fr_1fr] items-center justify-center max-w-[1200px] mx-auto min-h-screen pt-12 px-4">
        {/* Left column */}
        <div className="flex flex-col items-start gap-8">
          {/* Motivational text */}
          <div className="mt-0">
            <div className="text-[22px] text-gray-900 dark:text-gray-100 font-normal mb-2">
              You <b>don't</b> have<br />to <b>struggle</b> in<br />silence!
            </div>
          </div>
          {/* Talk Heal Connect image below the text */}
          <img
            src="/talk-heal-connect.png"
            alt="Talk. Heal. Connect."
            className="max-w-[120px] w-full h-auto rounded-full shadow-md bg-gray-50 dark:bg-gray-800 mt-3 self-center"
          />
        </div>
        {/* Center column */}
        <div className="flex flex-col items-center gap-6">
          {/* Headline image */}
          <img
            src="/headline-image.png"
            alt="Your Mental Health Matter headline"
            className="max-w-[600px] w-full h-auto mb-4"
          />
          {/* Hero illustration with breathing animation */}
          <motion.img
            src="/hero-illustration.png"
            alt="Hero illustration: meditating woman in cosmic head"
            className="max-w-[420px] w-full h-auto rounded-2xl shadow-lg"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
          />
        </div>
        {/* Right column */}
        <div className="flex flex-col items-end gap-8 mt-20">
          {/* Hope card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-4 min-w-[220px] mb-6 flex items-center justify-center">
            <div className="text-[15px] text-gray-900 dark:text-gray-100 font-normal text-center">
              There's <b>hope</b> when<br />your <b>brain</b> tell's<br />you there isn't
            </div>
          </div>
        </div>
      </div>
      {/* About Us Section */}
      <div className="max-w-[800px] mx-auto mt-12 bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-10 font-sans">
        <h2 className="font-serif font-bold text-3xl text-primary-900 dark:text-primary-100 mb-4">About Us</h2>
        <p className="text-lg text-gray-900 dark:text-gray-100 mb-5">
          <b>MindSpace</b> is your safe, supportive space for mental and emotional wellbeing. We provide AI-powered chat support, peer-to-peer connections, and self-help resources—so you never have to face tough times alone.
        </p>
        <h3 className="font-semibold text-xl text-accent-600 dark:text-accent-300 mb-2">The Problem</h3>
        <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
          Many people struggle in silence with stress, anxiety, loneliness, or emotional pain. Access to mental health support can be confusing, expensive, or intimidating. It's hard to know where to turn, and even harder to reach out for help.
        </p>
        <h3 className="font-semibold text-xl text-orange-600 dark:text-orange-300 mb-2">Our Solution</h3>
        <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
          MindSpace makes support accessible, private, and stigma-free. Our AI companion is always here to listen and offer guidance. If you need more, you can connect with trained peers for real conversations. Everything is confidential, judgment-free, and designed for your comfort.
        </p>
        <h3 className="font-semibold text-xl text-primary-900 dark:text-primary-100 mb-2">How to Use MindSpace</h3>
        <ul className="text-base text-gray-900 dark:text-gray-100 ml-5 mb-0 pl-0 list-disc">
          <li className="mb-2"><b>Chat with Alex:</b> Start a conversation with our AI companion for instant support, self-reflection, or just to talk.</li>
          <li className="mb-2"><b>Peer Support:</b> If you want to talk to a real person, request a peer match—someone who understands and cares.</li>
          <li className="mb-2"><b>Stay in Control:</b> Everything is private. You choose what to share and when to reach out for more help.</li>
          <li><b>Accessible Anytime:</b> MindSpace is here for you 24/7, whenever you need a safe space to talk or get support.</li>
        </ul>
      </div>
    </div>
  );
}