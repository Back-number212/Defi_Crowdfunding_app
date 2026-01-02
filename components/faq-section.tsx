interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is CrowdFundX?",
    answer: "CrowdFundX is a decentralized crowdfunding platform that helps individuals and organizations raise capital for their projects and ideas.",
  },
  {
    question: "How do I create a campaign?",
    answer: "You can create a campaign by clicking the 'Create Campaign' button and filling out the necessary information about your project.",
  },
  {
    question: "How can I support a campaign?",
    answer: "You can support a campaign by clicking the 'Donate' button on the campaign page and following the instructions.",
  },
  {
    question: "What are CrowdFundX's service fees?",
    answer: "CrowdFundX charges a 2% fee on the total amount raised to maintain the platform and provide support services.",
  },
];

export function FAQSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="space-y-6 text-white/90">
          {faqData.map((item, index) => (
            <div key={index} className="border-b border-white/30 pb-4">
              <h3 className="text-xl font-semibold mb-2">{item.question}</h3>
              <p className="">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
