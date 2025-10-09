import React from "react";
import { motion } from "framer-motion";
import { Calendar, Stethoscope, Building2, Users, ShieldCheck, Phone, Globe, LogIn, ArrowRight } from "lucide-react";
// Simple replacements until you add shadcn/ui
const Button = (props) => <button {...props} className="px-4 py-2 bg-blue-600 text-white rounded-lg" />;
const Card = ({ children }) => <div className="border rounded-lg shadow p-4 bg-white">{children}</div>;
const CardHeader = ({ children }) => <div className="mb-2">{children}</div>;
const CardTitle = ({ children }) => <h3 className="font-semibold">{children}</h3>;
const CardContent = ({ children }) => <div>{children}</div>;
const Input = (props) => <input {...props} className="border px-3 py-2 rounded-lg w-full" />;


// Landing page for a Medical Clinic Database app
// Tech assumptions: Vite + React + Tailwind + shadcn/ui + lucide-react + framer-motion
// You can drop this file in src/components/LandingPage.jsx and render it in src/App.jsx
// Replace link placeholders with your router paths (e.g., /login, /signup, /portal)

const features = [
  {
    icon: <Building2 className="h-6 w-6" aria-hidden />,
    title: "Multi‑Office Support",
    desc: "Manage locations across states with unified provider & patient records.",
  },
  {
    icon: <Stethoscope className="h-6 w-6" aria-hidden />,
    title: "Doctor & Patient Mapping",
    desc: "Assign patients to one or multiple doctors; support primary & specialists.",
  },
  {
    icon: <Calendar className="h-6 w-6" aria-hidden />,
    title: "Appointments",
    desc: "Schedule/cancel via phone or web with automated reminders.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" aria-hidden />,
    title: "Approvals Flow",
    desc: "Require primary physician approval before booking specialists.",
  },
  {
    icon: <Users className="h-6 w-6" aria-hidden />,
    title: "Role‑Based Access",
    desc: "Admin, Doctor, and Patient portals with scoped permissions.",
  },
  {
    icon: <Globe className="h-6 w-6" aria-hidden />,
    title: "Web Portal",
    desc: "Mobile‑first UI, fast search, and secure patient self‑service.",
  },
];

const statItems = [
  { label: "Offices", value: "12+" },
  { label: "Doctors", value: "150+" },
  { label: "Patients", value: "25k+" },
  { label: "Avg. Wait", value: "< 5 min" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">
      {/* Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6" aria-hidden />
            <span className="font-semibold tracking-tight">MedConnect</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-slate-900 text-slate-600">Features</a>
            <a href="#workflow" className="hover:text-slate-900 text-slate-600">Workflow</a>
            <a href="#contact" className="hover:text-slate-900 text-slate-600">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="gap-2" asChild>
              <a href="/login" aria-label="Sign in">
                <LogIn className="h-4 w-4" /> Sign in
              </a>
            </Button>
            <Button className="gap-2" asChild>
              <a href="/portal" aria-label="Open patient portal">
                Patient Portal <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-4xl/tight sm:text-5xl/tight font-extrabold tracking-tight">
                A modern front‑end for your <span className="text-slate-900">Medical Clinic Database</span>
              </h1>
              <p className="text-slate-600 text-lg">
                Manage multi‑office providers, doctor‑patient assignments, approvals, and appointments—all in one streamlined portal.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2" asChild>
                  <a href="/signup">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#features">Explore Features</a>
                </Button>
              </div>
              {/* Quick search mock */}
              <Card className="mt-4 max-w-xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quick lookup</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3">
                  <Input placeholder="Search doctors, patients, or offices…" aria-label="Quick search" />
                  <Button className="gap-2" aria-label="Search">
                    Search <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className=""
            >
              <div className="grid grid-cols-2 gap-4">
                {statItems.map((s, i) => (
                  <Card key={i} className="rounded-2xl shadow-sm">
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold">{s.value}</div>
                      <div className="text-slate-500 text-sm mt-1">{s.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="mt-4 rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Today’s availability (example)</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" aria-hidden />
                  12 open slots across 3 offices
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">Everything clinics need—built‑in</h2>
            <p className="text-slate-600 mt-2 max-w-2xl">Design focuses on speed, clarity, and the exact workflows clinics use daily.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <Card className="h-full rounded-2xl shadow-sm">
                  <CardHeader className="space-y-1">
                    <div className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-2 w-10 h-10 text-slate-700">
                      {f.icon}
                    </div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow / CTA tiles */}
      <section id="workflow" className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LogIn className="h-5 w-5" /> Patient Portal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>Book/cancel appointments and request specialist approvals.</p>
                <Button className="gap-2 w-full" asChild>
                  <a href="/portal">Open Portal <ArrowRight className="h-4 w-4" /></a>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" /> Doctor Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>View day lists, manage panels, and approve specialist referrals.</p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/doctor">Go to Dashboard</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5" /> Admin Console
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>Manage offices, providers, schedules, and system policies.</p>
                <Button variant="ghost" className="w-full" asChild>
                  <a href="/admin">Open Console</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact / footer */}
      <section id="contact" className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Questions? Let’s talk.</h3>
                  <p className="text-slate-600 mt-1">We can tailor the front‑end to your exact database schema and auth setup.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2" asChild>
                    <a href="tel:+18001234567"><Phone className="h-4 w-4" /> Call</a>
                  </Button>
                  <Button className="gap-2" asChild>
                    <a href="mailto:hello@medconnect.example">Email us <ArrowRight className="h-4 w-4" /></a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} MedConnect • Built with React & Vite
        </div>
      </footer>
    </div>
  );
}
