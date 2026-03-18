import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";

const CREDENTIALS = [
  "Powerhouse Fitness Alumni",
  "Lifter & Runner",
  "Built Kairo from scratch",
  "CS @ Arizona State",
] as const;

/**
 * About / Coach section — real content from chazwyllie.com.
 * Photo: https://chazwyllie.com/assets/images/profile-photo.jpg
 * Server component — no state or effects.
 */
export default function About() {
  return (
    <section
      id="about"
      className="py-24 md:py-32 px-5 md:px-10"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left: real photo */}
          <ScrollReveal className="flex justify-center lg:justify-start">
            <div
              className="relative w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)]"
              style={{
                border: "1px solid var(--border-subtle)",
                aspectRatio: "3 / 4",
              }}
            >
              <Image
                src="https://chazwyllie.com/assets/images/profile-photo.jpg"
                alt="Chaz Wyllie — founder of Kairo Coaching"
                fill
                sizes="(max-width: 1024px) 80vw, 384px"
                className="object-cover object-top"
                priority
              />
              {/* Subtle accent corner accents */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 w-8 h-8 pointer-events-none"
                style={{
                  borderTop: "2px solid var(--accent-primary)",
                  borderLeft: "2px solid var(--accent-primary)",
                  borderTopLeftRadius: "var(--radius-lg)",
                  opacity: 0.5,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none"
                style={{
                  borderBottom: "2px solid var(--accent-primary)",
                  borderRight: "2px solid var(--accent-primary)",
                  borderBottomRightRadius: "var(--radius-lg)",
                  opacity: 0.5,
                }}
              />
            </div>
          </ScrollReveal>

          {/* Right: bio */}
          <div className="flex flex-col gap-8">
            <ScrollReveal>
              <p
                className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
                style={{ color: "var(--accent-primary)" }}
              >
                Meet your coach
              </p>
              <h2
                className="font-display font-black leading-none"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                }}
              >
                The person
                <br />
                <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
                  behind the plan.
                </span>
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <p
                className="text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                I&apos;m Chaz — I built Kairo because I lived the problem. Balancing
                a full CS degree at ASU with consistent training taught me that the
                plans that actually work aren&apos;t the rigid ones. They&apos;re the
                ones that bend without breaking.
              </p>
              <p
                className="mt-4 text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                I spent years at Powerhouse Fitness watching people start strong
                and fall off — not because they lacked motivation, but because their
                plan couldn&apos;t handle a real week. Kairo is the system I wish
                existed: daily adaptation, 30-second logging, and coaching that
                treats consistency as the goal — not perfection.
              </p>
              <p
                className="mt-4 text-base leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                My mindset: <em style={{ color: "var(--text-primary)" }}>consistency,
                feedback loops, and measurable progress.</em> Same principles I apply
                to engineering and the same ones Kairo coaching is built on.
              </p>
            </ScrollReveal>

            {/* Credential pills */}
            <ScrollReveal delay={200}>
              <div className="flex flex-wrap gap-3" role="list" aria-label="Background">
                {CREDENTIALS.map((cred) => (
                  <span
                    key={cred}
                    role="listitem"
                    className="rounded-full px-4 py-1.5 text-sm"
                    style={{
                      border: "1px solid var(--border-hover)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {cred}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}
