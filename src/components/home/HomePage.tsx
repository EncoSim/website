const HOW_IT_WORKS = [
  {
    title: "Create Characters",
    desc: "Create your very own players and enemies with out character editor.",
  },
  {
    title: "Prepare a Challenge",
    desc: "Ready your party and prepare your challenge with the simulation editor.",
  },
  {
    title: "Analyze",
    desc: "Simulate your encounter and get detailed combat and performance statics.",
  },
];

/** Placeholder: the logo links here. */
export function HomePage() {
  return (
    <section aria-label="Home" className="grid min-h-[50dvh] place-items-center text-center">
      <section id="how-it-works" className="py-20 bg-midnight">
        <h2 className="font-fancy text-3xl font-bold text-accent-2 mb-6">How It Works</h2>
        <p className="text-xl text-silver-dark max-w-3xl mx-auto mb-6">
          Get started in minutes with our intuitive encounter simulator
        </p>

        <div className="grid md:grid-cols-3 gap-12">
          {HOW_IT_WORKS.map(({ title, desc }, i) => (
            <div className="text-center scroll-fade">
              <div className="size-16 bg-accent-1 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 font-bold">
                {i + 1}
              </div>
              <h3 className="font-fancy text-2xl font-bold text-silver mb-4">{title}</h3>
              <p className="text-silver-dark">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="place-items-center mb-12">
        <h3 className="font-fancy text-3xl font-bold text-accent-2 mb-6">
          Found a Bug, need a Feature?
        </h3>
        <p>
          Send us an email{" "}
          <a href="mailto:encosim@uber.space" className="text-accent-2">
            encosim@uber.space
          </a>{" "}
          or open an issue on{" "}
          <a href="https://github.com/orgs/EncoSim/repositories" className="text-accent-2">
            GitHub
          </a>
          .
        </p>
      </section>
      <p className="text-white/40">Under construction, please be patient.</p>
    </section>
  );
}
