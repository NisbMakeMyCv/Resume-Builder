import Link from "next/link";
import Container from "./components/Container";
import MaterialIcon from "./components/MaterialIcon";

/**
 * Landing page — coded exactly from the `refined_landing_page` stitch frame.
 * Interactive CTAs link to the real /signin and /signup routes.
 */
export default function Home() {
  return (
    <main className="bg-background text-on-background font-body-md overflow-x-hidden">
      {/* ================= TOP NAV BAR ================= */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant">
        <Container className="h-16 flex justify-between items-center">
          <div className="text-headline-md font-bold text-primary shrink-0">
            MakeMyCV
          </div>

          <nav className="hidden md:flex gap-8 items-center h-full">
            <NavLink active href="/#templates">
              Templates
            </NavLink>
            <NavLink href="/#features">Examples</NavLink>
            <NavLink href="/#how-it-works">Guides</NavLink>
            <NavLink href="/#pricing">Pricing</NavLink>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="hidden sm:block text-label-md font-semibold text-primary px-4 py-2 rounded-full hover:bg-surface-container transition-all btn-press"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-on-primary px-6 py-2.5 rounded-full text-label-md font-semibold shadow-md hover:shadow-lg hover:bg-primary/90 transition-all btn-press"
            >
              Build My CV
            </Link>
          </div>
        </Container>
      </header>

      <main className="pt-16">
        {/* ================= HERO SECTION ================= */}
        <section className="relative min-h-[85vh] flex items-center hero-gradient overflow-hidden">
          <Container className="w-full grid grid-cols-12 gap-6 items-center">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-7 space-y-8 py-12 lg:py-20 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-label-sm">
                <MaterialIcon
                  name="auto_awesome"
                  className="text-[16px]"
                />
                AI-Powered IEEE Standards
              </div>

              <h1 className="font-headline-lg text-[44px] md:text-[60px] lg:text-[72px] leading-[1.1] text-primary">
                Build Your Dream Resume.
                <br />
                <span className="text-secondary">Land Your Career.</span>
              </h1>

              <p className="text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                Elevate your professional profile with our IEEE-standard CV
                builder. Powered by AI to beat the bots and impress human
                recruiters.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/signup"
                  className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all btn-press"
                >
                  Start Building For Free
                </Link>
                <Link
                  href="#templates"
                  className="bg-surface-container-highest text-primary px-8 py-4 rounded-full font-semibold text-lg hover:bg-surface-container-high transition-all"
                >
                  View Templates
                </Link>
              </div>

              <div className="flex items-center gap-4 text-on-surface-variant">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-surface-dim" />
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-surface-container" />
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-secondary-fixed" />
                </div>
                <p className="text-label-md">
                  <span className="font-bold text-on-surface">10,000+</span>{" "}
                  professionals hired this month
                </p>
              </div>
            </div>

            {/* Right Column: Resume mockup */}
            <div className="col-span-12 lg:col-span-5 relative flex justify-center lg:justify-end py-12 lg:py-0">
              <div className="glass-card p-4 rounded-[32px] border border-outline-variant shadow-2xl animate-float relative z-10 w-full max-w-[480px]">
                <div className="bg-white rounded-[24px] overflow-hidden border border-outline-variant aspect-[3/4] flex flex-col">
                  {/* Mockup Top Bar */}
                  <div className="h-12 bg-surface-container/50 border-b border-outline-variant flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-error/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                  </div>

                  {/* Mockup Content */}
                  <div className="flex-1 p-8 flex gap-8">
                    <div className="w-1/3 space-y-6 border-r border-outline-variant pr-8">
                      <div className="h-4 w-full bg-surface-container rounded-sm" />
                      <div className="space-y-3">
                        <div className="h-2 w-full bg-surface-container-low rounded-sm" />
                        <div className="h-2 w-5/6 bg-surface-container-low rounded-sm" />
                        <div className="h-2 w-4/6 bg-surface-container-low rounded-sm" />
                      </div>
                      <div className="pt-6 space-y-3">
                        <div className="h-6 w-full bg-primary/5 rounded-md" />
                        <div className="h-6 w-full bg-surface-container-low rounded-md" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-8">
                      <div className="h-8 w-2/3 bg-primary/10 rounded-sm" />
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-surface-container rounded-full shrink-0" />
                        <div className="flex-1 space-y-3 py-2">
                          <div className="h-4 w-full bg-surface-container rounded-sm" />
                          <div className="h-3 w-1/2 bg-surface-container-low rounded-sm" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-2 w-full bg-surface-container-low rounded-sm" />
                        <div className="h-2 w-full bg-surface-container-low rounded-sm" />
                        <div className="h-2 w-5/6 bg-surface-container-low rounded-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -z-10" />
            </div>
          </Container>
        </section>

        {/* ================= FEATURES BENTO GRID ================= */}
        <section id="features" className="py-24 md:py-32 bg-white">
          <Container>
            <div className="text-center mb-20 space-y-6">
              <h2 className="font-headline-lg text-[36px] md:text-[48px] text-primary">
                Everything You Need to Get Hired
              </h2>
              <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                Modern tools for modern job seekers. We handle the formatting
                and technicalities so you can focus on your achievements.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <FeatureCard
                icon="psychology"
                iconClass="bg-primary-container"
                title="AI Resume Assistant"
                text="Our intelligent AI analyzes job descriptions and suggests powerful action verbs and skills to highlight your expertise."
              />
              <FeatureCard
                icon="fact_check"
                iconClass="bg-secondary"
                title="ATS Resume Checker"
                text="Instant feedback on how well your CV ranks against Applicant Tracking Systems used by top Fortune 500 companies."
              />
              <FeatureCard
                icon="web_stories"
                iconClass="bg-primary"
                title="Beautiful Templates"
                text="Professionally designed IEEE-standard templates that are aesthetically pleasing and recruiter-approved."
              />
            </div>
          </Container>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section id="how-it-works" className="py-24 md:py-32 bg-surface-container-low overflow-hidden">
          <Container>
            <div className="text-center mb-24">
              <h2 className="font-headline-lg text-[36px] md:text-[48px] text-primary">
                Your Path to Employment
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-4">
                Three simple steps to a professional CV.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <Step
                number="1"
                title="Pick a Template"
                text="Select from our curated list of professional, ATS-friendly designs."
              />
              <Step
                number="2"
                title="Input Your Content"
                text="Follow our prompts and use AI suggestions to describe your experience."
              />
              <Step
                number="3"
                title="Download & Apply"
                text="Get your CV in PDF or DOCX format and start landing interviews."
              />
            </div>
          </Container>
        </section>

        {/* ================= CTA ================= */}
        <section id="pricing" className="py-24 md:py-32">
          <Container>
            <div className="bg-primary-container rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-10">
                <h2 className="text-white font-headline-lg text-[40px] md:text-[56px] leading-tight">
                  Ready to Build Your Resume?
                </h2>
                <p className="text-on-primary-container/90 text-body-lg max-w-2xl mx-auto leading-relaxed">
                  Join thousands of job seekers who landed their dream jobs
                  using MakeMyCV&apos;s professional tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                  <Link
                    href="/signup"
                    className="bg-white text-primary px-12 py-5 rounded-full font-bold text-xl hover:bg-secondary-fixed transition-all btn-press shadow-lg"
                  >
                    Get Started Now
                  </Link>
                  <Link
                    href="#features"
                    className="bg-transparent text-white border-2 border-white/30 px-12 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition-all btn-press"
                  >
                    View Examples
                  </Link>
                </div>
              </div>

              {/* Abstract Background Shapes */}
              <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px]" />
              <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-on-primary-container/10 rounded-full blur-[100px]" />
            </div>
          </Container>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <Footer />
    </main>
  );
}

/* =========================================================
   LOCAL COMPONENTS
   ========================================================= */

function NavLink({
  href,
  active = false,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`text-label-md hover:text-primary transition-colors h-full flex items-center border-b-2 ${
        active
          ? "border-primary text-primary font-bold"
          : "border-transparent text-on-surface-variant"
      }`}
    >
      {children}
    </a>
  );
}

function FeatureCard({
  icon,
  iconClass,
  title,
  text,
}: {
  icon: string;
  iconClass: string;
  title: string;
  text: string;
}) {
  return (
    <div className="col-span-12 md:col-span-4 tilt-card p-8 bg-surface-bright border border-outline-variant rounded-[24px] flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className="space-y-6">
        <div
          className={`w-14 h-14 ${iconClass} rounded-2xl flex items-center justify-center`}
        >
          <MaterialIcon
            name={icon}
            className="text-white text-3xl"
            filled
          />
        </div>
        <h3 className="font-headline-md text-primary text-2xl">{title}</h3>
        <p className="text-on-surface-variant leading-relaxed">{text}</p>
      </div>
      <div className="pt-8">
        <span className="text-primary font-bold flex items-center gap-2 group cursor-pointer">
          Learn More{" "}
          <MaterialIcon
            name="arrow_forward"
            className="group-hover:translate-x-1 transition-transform"
          />
        </span>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="col-span-12 md:col-span-4 flex flex-col items-center text-center space-y-8">
      <div className="w-20 h-20 rounded-full bg-white border-4 border-primary-fixed text-primary font-bold text-2xl flex items-center justify-center shadow-xl">
        {number}
      </div>
      <div className="space-y-4">
        <h4 className="font-bold text-xl text-primary">{title}</h4>
        <p className="text-on-surface-variant max-w-xs mx-auto leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-surface-container border-t border-outline-variant">
      <Container className="py-20">
        <div className="grid grid-cols-12 gap-6 mb-16">
          <div className="col-span-12 md:col-span-4 space-y-6">
            <div className="text-headline-md font-bold text-primary">
              MakeMyCV
            </div>
            <p className="text-on-surface-variant max-w-xs leading-relaxed">
              The ultimate IEEE-standard CV builder for ambitious professionals
              worldwide.
            </p>
          </div>

          <div className="col-span-6 md:col-span-2 space-y-6">
            <h5 className="font-bold text-on-surface">Product</h5>
            <ul className="space-y-4 text-on-surface-variant">
              <FooterLink>Templates</FooterLink>
              <FooterLink>AI Writer</FooterLink>
              <FooterLink>ATS Scan</FooterLink>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2 space-y-6">
            <h5 className="font-bold text-on-surface">Resources</h5>
            <ul className="space-y-4 text-on-surface-variant">
              <FooterLink>Career Blog</FooterLink>
              <FooterLink>Guides</FooterLink>
              <FooterLink>FAQ</FooterLink>
            </ul>
          </div>

          <div className="col-span-12 md:col-span-4 space-y-6">
            <h5 className="font-bold text-on-surface">Newsletter</h5>
            <p className="text-on-surface-variant">
              Get the latest career tips delivered to your inbox.
            </p>
            {/* Newsletter has no backend endpoint yet — rendered as a static field */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                readOnly
                className="bg-surface-container-lowest border border-outline-variant rounded-full px-6 py-3 flex-1 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-not-allowed"
              />
              <button
                type="button"
                aria-label="Subscribe"
                disabled
                className="bg-primary text-white p-3 rounded-full opacity-60 cursor-not-allowed"
              >
                <MaterialIcon name="send" className="block" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-label-sm text-on-surface-variant">
            © 2026 MakeMyCV. Made by NISB.
          </p>
          <div className="flex gap-8 text-label-sm font-semibold text-on-surface-variant">
            <a className="hover:underline" href="#">
              Privacy Policy
            </a>
            <a className="hover:underline" href="#">
              Terms of Service
            </a>
            <a className="hover:underline" href="#">
              Contact Us
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterLink({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <a className="hover:text-primary transition-colors cursor-pointer">
        {children}
      </a>
    </li>
  );
}
