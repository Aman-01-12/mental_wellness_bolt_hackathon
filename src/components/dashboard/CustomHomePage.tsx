import React, { useState, useRef, useEffect } from 'react';

export default function CustomHomePage() {
  const [showInfo1, setShowInfo1] = useState(false);
  const [showInfo2, setShowInfo2] = useState(false);
  const info1Ref = useRef<HTMLDivElement>(null);
  const info2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showInfo1 && info1Ref.current && !info1Ref.current.contains(event.target as Node)
      ) {
        setShowInfo1(false);
      }
      if (
        showInfo2 && info2Ref.current && !info2Ref.current.contains(event.target as Node)
      ) {
        setShowInfo2(false);
      }
    }
    if (showInfo1 || showInfo2) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo1, showInfo2]);

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-[#112218] dark group/design-root overflow-x-hidden"
      style={{ fontFamily: '"Space Grotesk", "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#244733] px-10 py-3">
          <div className="flex items-center gap-4 text-white">
            <div className="size-4">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">MindSpace</h2>
          </div>
        </header>
        <div className="px-4 sm:px-10 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="@container">
              <div className="@[480px]:p-4">
                <div
                  className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-center justify-center p-4"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCTZ4NaBh4p3GdywV4ylWsSBresxfdzYh2ArqxewrWQ_DH6kSTFKgjOPx5mRudIwDPm10R1RTgJqgAyqNGGrBwU-GeTxGVtJbi5EmjwMXYzdHco4QcESwojzCHuMHKP_zXe7I_jRZz_hUd8h79-MJMxVAAMaGF6JViR7vE53jRh7OSbexxDwTchF_BiaW13eaYVRcxjIHGnt8a5nBXfsM9UhK8QL8Nvt88VK5VJEwRr6PSG71tJDP3WXhtkuYtgwfDLtdgT_x08sDg")',
                  }}
                >
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em]">
                      Your Mental Wellness Journey Starts Here
                    </h1>
                    <h2 className="text-white text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal">
                      MindSpace is your companion for mental and emotional wellbeing. Connect with peers, chat with our AI, and access self-help resources anytime, anywhere.
                    </h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-10 px-4 py-10 @container">
              <div className="flex flex-col gap-4">
                <h1 className="text-white tracking-light text-[32px] font-bold leading-tight @[480px]:text-4xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] max-w-[720px]">
                  How MindSpace Supports You
                </h1>
                <p className="text-white text-base font-normal leading-normal max-w-[720px]">
                  MindSpace offers a comprehensive approach to mental wellness, combining AI-powered support, peer connections, and self-help resources.
                </p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-0">
                {/* Card 1 */}
                <div className="flex flex-1 gap-3 rounded-lg border border-[#336649] bg-[#1a3325] p-4 flex-col">
                  <div className="text-white" data-icon="ChatCircleDots" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-white text-base font-bold leading-tight">Chat with Alex, Your AI Companion</h2>
                    <p className="text-[#92c8aa] text-sm font-normal leading-normal">
                      Alex is available 24/7 to provide immediate support, guidance, and personalized recommendations.
                    </p>
                  </div>
                </div>
                {/* Card 2 */}
                <div className="flex flex-1 gap-3 rounded-lg border border-[#336649] bg-[#1a3325] p-4 flex-col">
                  <div className="text-white" data-icon="Users" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-white text-base font-bold leading-tight">Connect with Supportive Peers</h2>
                    <p className="text-[#92c8aa] text-sm font-normal leading-normal">
                      Join a community of individuals who understand and support each other's mental wellness journeys.
                    </p>
                  </div>
                </div>
                {/* Card 3: Access Self-Help Resources */}
                <div className="flex flex-1 gap-3 rounded-lg border border-[#336649] bg-[#1a3325] p-4 flex-col relative">
                  <div className="text-white" data-icon="BookOpen" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M224,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h64a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z"></path>
                    </svg>
                  </div>
                  <div className="flex flex-row items-center gap-1" ref={info1Ref}>
                    <h2 className="text-white text-base font-bold leading-tight">Access Self-Help Resources</h2>
                    <button
                      className="ml-1 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-[#244733] text-white border border-[#336649] hover:bg-[#336649] focus:outline-none"
                      onClick={() => setShowInfo1((v) => !v)}
                      aria-label="Info about Self-Help Resources"
                      type="button"
                    >
                      i
                    </button>
                    {showInfo1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 whitespace-nowrap">
                        This feature to be rolled out soon!
                      </div>
                    )}
                  </div>
                  <p className="text-[#92c8aa] text-sm font-normal leading-normal">
                    Explore a library of articles, exercises, and tools to enhance your mental and emotional wellbeing.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-10 px-4 py-10 @container">
              <div className="flex flex-col gap-4">
                <h1 className="text-white tracking-light text-[32px] font-bold leading-tight @[480px]:text-4xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] max-w-[720px]">
                  Why Choose MindSpace?
                </h1>
                <p className="text-white text-base font-normal leading-normal max-w-[720px]">
                  MindSpace addresses the challenges of inaccessible mental health support by providing an accessible, private, and stigma-free solution.
                </p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3">
                {/* Feature Card 1 */}
                <div className="flex flex-col gap-3 pb-3">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAkFE_1iUz8vn6p6QGqKZznV_q_Tz5eXLPnZe2dU1x_jmNIN4nwTSwqP1HEKDs9rqRgYwhrFMFzcymC36bUeLzCikKkd_-Ls0-b6ahnTbttWfJuzMewvnzo9-WVLmcWhsVga-qmKBhSL6x6UzWquRt4om-_HYx9hD50vnh_VhoYsPkrK8eZfEdn3FMIPUaHLVwhCGtO9G2n-pNlISFYI-TTqy1ALtCCNOe-9kqgKArDxZpVIeQHxYvAIb8ZZDbr1JdoPAZO3W17ZEQ")' }}
                  ></div>
                  <div>
                    <p className="text-white text-base font-medium leading-normal">Accessible Support</p>
                    <p className="text-[#92c8aa] text-sm font-normal leading-normal">Get support anytime, anywhere, with 24/7 access to Alex and peer connections.</p>
                  </div>
                </div>
                {/* Feature Card 2 */}
                <div className="flex flex-col gap-3 pb-3">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDvioNex6uI32tbPtn8_eEsZM9XiGhb5Ei5QG1Iy2Pa-GFLlobfl_-UieYCA_sM_zZw8kqnyX_Vl8gbvzcDJanj22U9qCeaPHKLJLoW5uXgBDX9tW3m5-ko36cBEU_iCTxUSppNMVT9pplM2hszOthvIbm8CTFMt1pABK3Znh3bUffe_GB04B2u0HolFGL2Et3MmwMfkQc0jNs-5fZDCPBRHoU3Igs6iimii15pVWRU6AlM_kLFzSA9F1pP_4C0qwa_BquPjMC5qlg")' }}
                  ></div>
                  <div>
                    <p className="text-white text-base font-medium leading-normal">Private and Secure</p>
                    <p className="text-[#92c8aa] text-sm font-normal leading-normal">Your privacy is our priority. MindSpace ensures your data is secure and confidential.</p>
                  </div>
                </div>
                {/* Feature Card 3: Stigma-Free Environment */}
                <div className="flex flex-col gap-3 pb-3 relative">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBvODfreoBhI7QCuKppo4uX6OKR8xOdvr8gqETzw1ccqeQoRJ8htmYibEUN5-vNAAqlZhBNw3QsaDdAgMRDxM7y0SbGRxlmWJJfTm9TNcNdZOLl8mt9665wYNi4Cs30bO0zF5fcPZDEp6tc_Isqywv2Lw7Gf45PW0lfnnqj7Lw-Fsdq4u4tS9_GpAEqxXQXc3IL2IfCq28JuVVpVEBXHOmSwqogj5dvRfF4vxolCRziUeYSVxJBmkh5S4mc7jXZkqvKlA8t1NGiU40")' }}
                  ></div>
                  <div className="flex flex-row items-center gap-1" ref={info2Ref}>
                    <p className="text-white text-base font-medium leading-normal">Stigma-Free Environment</p>
                    <button
                      className="ml-1 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-[#244733] text-white border border-[#336649] hover:bg-[#336649] focus:outline-none"
                      onClick={() => setShowInfo2((v) => !v)}
                      aria-label="Info about Stigma-Free Environment"
                      type="button"
                    >
                      i
                    </button>
                    {showInfo2 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 whitespace-nowrap">
                        This feature to be rolled out soon!
                      </div>
                    )}
                  </div>
                  <p className="text-[#92c8aa] text-sm font-normal leading-normal">Join a community that embraces mental wellness without judgment or stigma.</p>
                </div>
              </div>
            </div>
            <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">About Us</h2>
            <p className="text-white text-base font-normal leading-normal pb-3 pt-1 px-4">
              MindSpace was created with the mission to make mental wellness support accessible to everyone. We believe that everyone deserves to have a safe space to explore their
              emotions, connect with others, and find the resources they need to thrive. Our team of experts in mental health and technology is dedicated to providing a supportive
              and empowering platform for your journey.
            </p>
          </div>
        </div>
        <footer className="flex justify-center">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <footer className="flex flex-col gap-6 px-5 py-10 text-center @container">
              <div className="flex flex-wrap items-center justify-center gap-6 @[480px]:flex-row @[480px]:justify-around">
                <a className="text-[#92c8aa] text-base font-normal leading-normal min-w-40" href="#">Privacy Policy</a>
                <a className="text-[#92c8aa] text-base font-normal leading-normal min-w-40" href="#">Terms of Service</a>
                <a className="text-[#92c8aa] text-base font-normal leading-normal min-w-40" href="#">Contact Us</a>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#">
                  <div className="text-[#92c8aa]" data-icon="TwitterLogo" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="#">
                  <div className="text-[#92c8aa]" data-icon="InstagramLogo" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="#">
                  <div className="text-[#92c8aa]" data-icon="FacebookLogo" data-size="24px" data-weight="regular">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,191.63V152h24a8,8,0,0,0,0-16H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,0-16H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0,0,16h24v63.63a88,88,0,1,1,16,0Z"></path>
                    </svg>
                  </div>
                </a>
              </div>
              <p className="text-[#92c8aa] text-base font-normal leading-normal">@2025 MindSpace. All rights reserved.</p>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  );
} 