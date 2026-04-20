export type ArchetypeEmergence = "empirical" | "refined" | "theoretical";

export interface ArchetypeData {
  id: string;
  name: string;
  /** Short list/card description (~2–3 sentences). */
  summary: string;
  /** Detail-view description (~5–7 sentences). */
  description: string;
  characteristicTension: string;
  /** Markdown prose with inline external links describing governance traditions
   *  and movements that express this orientation. */
  traditions: string;
  prototype: number[]; // 12-element array, axis scores -1.0 to +1.0
  displayOrder: number;
  /** Provenance of the prototype vector. */
  emergence: ArchetypeEmergence;
}

export const EMERGENCE_LABELS: Record<ArchetypeEmergence, string> = {
  empirical: "Emerged from data",
  refined: "Refined with data",
  theoretical: "Theoretically derived",
};

export const EMERGENCE_TOOLTIPS: Record<ArchetypeEmergence, string> = {
  empirical:
    "This archetype was identified through a synthetic population study in April 2026. Its prototype vector is centered on an empirical cluster rather than designed from comparative political philosophy.",
  refined:
    "This archetype was originally hand-crafted from comparative political philosophy, then its prototype vector was adjusted toward the empirical centroid of the matching cluster in a synthetic population study (April 2026).",
  theoretical:
    "This archetype is derived from comparative political philosophy. No strong empirical cluster matched it in the synthetic population study, but it represents a coherent and historically grounded tradition.",
};

export const archetypes: ArchetypeData[] = [
  {
    id: "radical-egalitarian",
    name: "The Radical Egalitarian",
    summary:
      "Deeply committed to equality, progressive transformation, and cosmopolitan pluralism. Favors collective provision, distributed governance, and expansive civil liberties. Internationalist, non-interventionist, ecologically minded.",
    description:
      "Deeply committed to economic equality, progressive social transformation, and cosmopolitan pluralism. Favors strong collective provision, distributed governance, and expansive civil liberties. Internationalist in orientation and non-interventionist in practice. Sees most social hierarchies as constructed and unjust, and believes policy can and should dismantle them. Ecologically minded and precautionary toward technology that concentrates power or disrupts human relationships. More at home in cosmopolitan cities and diaspora networks than in nationally bounded political communities.",
    characteristicTension:
      "Transformative egalitarian goals often require concentrated state power to implement, conflicting with commitments to distributed governance and individual liberty.",
    traditions:
      "This orientation runs through the [New Left](https://en.wikipedia.org/wiki/New_Left) of the 1960s–70s, which pushed beyond class politics to include civil rights, gender, sexuality, ecology, and anti-imperialism across the US and Western Europe. The contemporary [democratic socialist](https://en.wikipedia.org/wiki/Democratic_socialism) movement — most visible in the US through the DSA and Sanders' platform, and in the UK through the Corbyn-era Labour left — combines redistribution with progressive social transformation and skepticism of foreign military intervention. Southern European post-austerity parties, including Spain's [Podemos](https://en.wikipedia.org/wiki/Podemos_\\(Spanish_political_party\\)) and Greece's Syriza, fused anti-austerity economics with pluralist social politics after the 2008 crisis.",
    prototype: [-0.85, -0.45, -0.45, -0.2, -0.55, -0.55, -0.7, -0.6, -0.75, -0.45, -0.6, -0.4],
    displayOrder: 1,
    emergence: "refined",
  },
  {
    id: "popular-egalitarian",
    name: "The Popular Egalitarian",
    summary:
      "Material equality grounded in popular self-determination rather than expert coordination. Favors redistribution and collective provision within a growth-oriented, nationally autonomous frame. Distrusts elites, experts, and international institutions in equal measure.",
    description:
      "Believes material equality is the foundation of freedom, and that ordinary people — not experts, elites, or international institutions — should determine how their society is organized. Strongly favors collective provision and redistribution, but grounded in a developmentalist rather than post-growth frame: prosperity is the goal, and the state's job is to spread it broadly rather than hoard it at the top. Skeptical of concentrated power in all its forms — domestic oligarchies, foreign capital, and international bodies that set terms without accountability. Moderately pluralist and cautiously progressive, but not driven by cultural transformation; dignity and self-determination matter more than identity politics. Non-interventionist abroad. Sees sovereignty and equality as complementary: a people cannot be equal among themselves if they are not free as a nation.",
    characteristicTension:
      "Universalist egalitarian commitments — every person deserves dignity, every society deserves self-determination — sit alongside a sovereigntist resistance to the international coordination that would be needed to make those commitments real at scale. Solidarity is demanded at home and declined abroad.",
    traditions:
      "This orientation finds expression across much of the Global South. [African socialism](https://en.wikipedia.org/wiki/African_socialism) in the post-independence period — Nyerere's *Ujamaa* in Tanzania, Nkrumah's Ghana, Kaunda's Zambia — sought redistributive, communally grounded economies rooted in precolonial traditions of mutualism rather than imported Marxism. The [Latin American Pink Tide](https://en.wikipedia.org/wiki/Pink_tide) of the 2000s–2010s, spanning Brazil's Workers' Party, Bolivia's MAS, Uruguay's Frente Amplio, and Mexico's Morena, pushed against neoliberal prescriptions through expanded social provision and regional autonomy from US economic leadership. The older [Non-Aligned Movement](https://en.wikipedia.org/wiki/Non-Aligned_Movement) carried a related commitment: sovereign self-determination paired with calls for a more equitable global economic order, independent of either Cold War bloc.",
    prototype: [-0.7, 0.4, -0.5, -0.35, -0.55, -0.45, -0.4, -0.2, -0.5, 0.25, -0.7, -0.35],
    displayOrder: 2,
    emergence: "empirical",
  },
  {
    id: "social-democrat",
    name: "The Social Democrat",
    summary:
      "Strongly favors collective provision, public services, and redistribution within a democratic framework. Progressive on cultural issues, moderately pluralist, constructivist. Internationalist but not radically so; trusts institutions to implement an egalitarian agenda.",
    description:
      "Strongly favors collective provision, redistribution, and public services within a democratic framework. Progressive on cultural issues, moderately pluralist, leans constructivist. Internationalist but not radically so. Trusts institutions and expertise to implement an egalitarian agenda. Moderate on governance structure.",
    characteristicTension:
      "Desire for comprehensive public services requires centralized state capacity, which can conflict with progressive commitments to distributed power and individual autonomy.",
    traditions:
      "This orientation's clearest expression is the [Nordic model](https://en.wikipedia.org/wiki/Nordic_model) — Sweden's Social Democratic Party under Erlander and Palme, with analogues in Norway, Denmark, and Finland — which built universal welfare states funded by high taxation and tripartite labor-management-state coordination. The postwar [Attlee government](https://en.wikipedia.org/wiki/Attlee_ministry) in the UK established the NHS, nationalized key industries, and built the British welfare state that still anchors Labour's identity. Germany's [SPD](https://en.wikipedia.org/wiki/Social_Democratic_Party_of_Germany) reconciled socialism with markets at Bad Godesberg in 1959, then under Brandt pursued *ostpolitik* abroad and welfare expansion at home. Outside the West, India's [Kerala model](https://en.wikipedia.org/wiki/Kerala_model) combines redistribution, high human development, and democratic participation at a subnational scale.",
    prototype: [-0.7, -0.3, 0.0, 0.2, -0.2, -0.5, -0.5, -0.3, -0.4, -0.4, -0.2, 0.0],
    displayOrder: 3,
    emergence: "theoretical",
  },
  {
    id: "green-communalist",
    name: "The Green Communalist",
    summary:
      "Ecological sustainability as the organizing principle of politics. Favors degrowth or post-growth economics, radical decentralization, and local self-sufficiency. Skeptical of both state and market; internationalist in sympathy, localist in practice.",
    description:
      "Ecological sustainability is the organizing principle. Favors degrowth or post-growth economics, radical decentralization, local self-sufficiency, and collective provision at the community level. Non-interventionist, precautionary toward technology, and moderately progressive. Skeptical of both state and market as drivers of ecological destruction. Internationalist in sympathy but localist in practice.",
    characteristicTension:
      "Ecological goals at planetary scale require coordination that conflicts with deep commitment to local autonomy and anti-centralization.",
    traditions:
      "This orientation is articulated most clearly in [social ecology](https://en.wikipedia.org/wiki/Social_ecology_\\(Bookchin\\)), Murray Bookchin's political philosophy of confederated democratic municipalities as an ecological alternative to both capitalism and state socialism. It finds living expression in the [Zapatista](https://en.wikipedia.org/wiki/Zapatista_Army_of_National_Liberation) communities of Chiapas, which since 1994 have built autonomous indigenous self-governance through communal assemblies, and in [democratic confederalism](https://en.wikipedia.org/wiki/Democratic_confederalism) in Rojava, the Kurdish political project of feminist, ecological, pluralist self-governance in northeast Syria. At smaller scales, the [Transition Towns](https://en.wikipedia.org/wiki/Transition_town) network builds local resilience against climate and energy shocks through community-led relocalization of food, energy, and economy.",
    prototype: [-0.6, -0.9, -0.8, -0.5, -0.3, -0.4, -0.4, -0.2, -0.3, -0.4, -0.7, -0.6],
    displayOrder: 4,
    emergence: "theoretical",
  },
  {
    id: "communitarian-steward",
    name: "The Communitarian Steward",
    summary:
      "Envisions small-scale, rooted communities shaped by tradition and local self-determination. Favors ecological limits, distributed governance, and cultural continuity. Non-interventionist and cautious about technology that disrupts community life.",
    description:
      "Envisions small-scale, rooted, sustainable communities shaped by tradition and local self-determination. Favors ecological limits, distributed governance, and the preservation of inherited ways of life. Skeptical of centralized state power and of technology that erodes communal relationships. Populist in register — trusts community wisdom and elders over expert authority. Non-interventionist abroad and cautiously sovereigntist. The commitment is to communal integrity rather than to uniform national culture: the archetype protects each community's right to remain itself, which often means defending pluralism at the national or international scale while valuing cohesion within the community.",
    characteristicTension:
      "Commitment to local autonomy means accepting that different communities will develop in directions the archetype itself disagrees with. Defense of one's own tradition and openness to others' traditions depend on the same principle but can be hard to hold together in practice.",
    traditions:
      "This orientation runs through [Catholic distributism](https://en.wikipedia.org/wiki/Distributism) — the early-20th-century philosophy of Chesterton, Belloc, and Pope Leo XIII's *Rerum Novarum* — advocating wide distribution of productive property, local cooperatives, and subsidiarity as an alternative to both capitalism and state socialism. Gandhi's [Sarvodaya](https://en.wikipedia.org/wiki/Sarvodaya) vision of self-sufficient village economies and artisanal production has shaped localist movements across India and the broader postcolonial world. Bhutan's [Gross National Happiness](https://en.wikipedia.org/wiki/Gross_National_Happiness) framework is unusual as a state-adopted version of what is typically a grassroots orientation, subordinating economic growth to ecological integrity, cultural preservation, and community wellbeing.",
    prototype: [-0.55, -0.65, -0.75, -0.6, -0.4, -0.25, 0.6, 0.15, 0.3, 0.4, -0.7, -0.6],
    displayOrder: 5,
    emergence: "refined",
  },
  {
    id: "institutional-moderate",
    name: "The Institutional Moderate",
    summary:
      "Trusts institutions, expertise, and process. Favors measured progress and growth-oriented policy over radical reform in any direction. Internationalist in sympathy, pragmatic about national constraints.",
    description:
      "Trusts institutions, expertise, and process as the foundations of good governance. Favors measured progress over radical transformation — progressive in general orientation, but skeptical of disruptive change from any direction. Prefers growth-oriented policy and targeted public investment to either market purism or sweeping redistribution. Internationalist in sympathy but pragmatic about national constraints. Comfortable with moderate centralization when it improves coordination and accountability. Less a defined ideology than a governing instinct: that competent, accountable administration is what democracy is actually for.",
    characteristicTension:
      "Commitment to competent administration can shade into technocratic paternalism — valuing outcomes legitimately produced by institutions over outcomes directly endorsed by voters. Tends to mistake proceduralism for democratic responsiveness.",
    traditions:
      "This orientation's most developed expression is postwar [Christian democracy](https://en.wikipedia.org/wiki/Christian_democracy) — Germany's CDU/CSU, Italy's DC, France's MRP — which dominated Western European governance after 1945 by building welfare capitalism, pursuing European integration, and practicing a politics of compromise. The Pearson–Trudeau era [Liberal Party of Canada](https://en.wikipedia.org/wiki/Liberal_Party_of_Canada) built universal healthcare, Pearsonian peacekeeping, and official bilingualism and multiculturalism. The postwar Japanese [LDP mainstream](https://en.wikipedia.org/wiki/Liberal_Democratic_Party_\\(Japan\\)), particularly under Yoshida and Ikeda, coordinated high-growth economic policy through close bureaucratic and business ties while anchoring the US alliance.",
    prototype: [-0.3, 0.5, 0.4, 0.55, -0.25, -0.35, -0.5, 0.25, -0.2, -0.15, -0.25, -0.1],
    displayOrder: 6,
    emergence: "refined",
  },
  {
    id: "cosmopolitan-technologist",
    name: "The Cosmopolitan Technologist",
    summary:
      "Believes global coordination and technological progress can address most governance problems. Strongly internationalist, pro-innovation, progressive, and pluralist. Trusts expert institutions and favors coordination-oriented centralization.",
    description:
      "Believes global coordination and technological progress can solve most problems. Strongly internationalist, pro-innovation, progressive, and pluralist. Trusts expert institutions and favors some centralization for coordination. Moderately market-oriented but comfortable with state investment in research and infrastructure. Leans constructivist.",
    characteristicTension:
      "Faith in expert governance can conflict with progressive values when technocratic recommendations cut against cultural inclusivity or individual autonomy.",
    traditions:
      "This orientation animated the [Third Way](https://en.wikipedia.org/wiki/Third_Way) of the 1990s–2000s — Clinton's New Democrats, Blair's New Labour, Schröder's *Neue Mitte* — which combined market-friendly economics with progressive social policy and multilateral internationalism. [Macronism](https://en.wikipedia.org/wiki/Macronism) in France frames itself explicitly as post-ideological technocratic centrism, committed to European integration and managerial reform. Further afield, [e-Estonia](https://en.wikipedia.org/wiki/E-Estonia) has rebuilt itself since 1991 as the world's most advanced digital state — with e-voting, e-residency, and the X-Road data infrastructure — and exported the model to Ukraine, Moldova, and partners across Africa and Asia.",
    prototype: [0.2, 0.4, 0.2, 0.6, -0.2, -0.3, -0.6, -0.5, -0.4, -0.8, 0.2, 0.8],
    displayOrder: 7,
    emergence: "theoretical",
  },
  {
    id: "free-marketeer",
    name: "The Free Marketeer",
    summary:
      "Strongly favors market allocation, economic growth, and individual economic liberty. Skeptical of state intervention and strongly pro-innovation. Treats distributed governance as a check on state power.",
    description:
      "Strongly favors market allocation, economic growth, and individual economic liberty. Skeptical of state intervention in the economy. Strongly pro-innovation. Distributed governance as a check on state power. Moderate to neutral on cultural issues — economics is the primary lens. Leans slightly toward sovereignty over internationalism.",
    characteristicTension:
      "Belief in individual liberty can conflict with acceptance of the corporate power that unregulated markets produce — market dominance is its own form of centralized authority.",
    traditions:
      "This orientation consolidated intellectually through the [Mont Pelerin Society](https://en.wikipedia.org/wiki/Mont_Pelerin_Society) — the 1947 network of Hayek, Mises, Friedman, Buchanan, and others that provided the postwar infrastructure for market-liberal revival — and the [Chicago School of economics](https://en.wikipedia.org/wiki/Chicago_school_of_economics) built around Milton Friedman. Its clearest political expressions were [Thatcherism](https://en.wikipedia.org/wiki/Thatcherism) in the UK, centered on privatization, deregulation, and monetarism, and the parallel Reagan-era US tradition combining tax cuts, supply-side economics, and cultural defense of market capitalism. The [Chicago Boys](https://en.wikipedia.org/wiki/Chicago_Boys), Chilean economists trained at Chicago, later carried the program to Latin America.",
    prototype: [0.8, 0.5, -0.3, 0.0, -0.6, -0.3, 0.0, 0.0, 0.2, 0.2, 0.0, 0.6],
    displayOrder: 8,
    emergence: "theoretical",
  },
  {
    id: "libertarian-individualist",
    name: "The Libertarian Individualist",
    summary:
      "Individual liberty as the paramount value. Deeply skeptical of state power in all its forms — economic, security, and cultural. Favors markets, distributed governance, and minimal state. Non-interventionist abroad.",
    description:
      "Individual liberty is the paramount value. Deeply skeptical of state power in all forms — economic, security, cultural. Favors market allocation, distributed governance, minimal law enforcement, and strong constitutional constraints. Pro-innovation but wary of government-directed technology. Non-interventionist. Neutral to slightly progressive on cultural issues — not deeply invested in social transformation, but opposed to the state enforcing traditional norms. Slightly essentialist — skeptical of social engineering.",
    characteristicTension:
      "Radical decentralization and minimal state capacity can leave individuals vulnerable to private concentrations of power that function much like the state authority they oppose.",
    traditions:
      "This orientation is carried in the US by the [libertarian movement](https://en.wikipedia.org/wiki/Libertarianism_in_the_United_States) — Cato, Reason, the Libertarian Party — synthesizing classical liberal economics with civil libertarianism on drugs, surveillance, and foreign policy. Its intellectual roots sit in the [Austrian School](https://en.wikipedia.org/wiki/Austrian_school_of_economics) from Menger through Mises and Hayek, and in the more radical [anarcho-capitalist](https://en.wikipedia.org/wiki/Anarcho-capitalism) strand of Rothbard and David Friedman, which holds that all governance functions can be provided through voluntary markets. The orientation has surged in Latin America through [Javier Milei's](https://en.wikipedia.org/wiki/Javier_Milei) Argentina and related movements in Uruguay, Ecuador, and Brazil's liberal-right networks.",
    prototype: [0.6, 0.3, -0.7, -0.4, -0.9, -0.4, -0.2, 0.0, 0.2, 0.3, -0.5, 0.5],
    displayOrder: 9,
    emergence: "theoretical",
  },
  {
    id: "developmental-modernizer",
    name: "The Developmental Modernizer",
    summary:
      "Favors strong centralized state capacity directed toward rapid modernization and national ascent. Pro-growth, security-forward, performance-legitimacy oriented. Uses technology instrumentally and trusts institutional expertise over popular input.",
    description:
      "Favors strong centralized state capacity directed toward rapid modernization and national ascent. Pro-growth, performance-legitimacy oriented, and security-forward. Comfortable with liberty-for-security tradeoffs in service of development and with cultural cohesion in service of social stability. Sovereignty-oriented — sees international institutions as constraints on national trajectories rather than as sources of legitimacy. Uses technology instrumentally rather than ideologically, adopting what works and regulating what threatens social order. Trusts institutional expertise and long-horizon state planning over popular input.",
    characteristicTension:
      "Performance-based legitimacy works while performance is strong — this archetype has no stable fallback when the developmental model hits limits or fails to deliver.",
    traditions:
      "This orientation's paradigm case is the [East Asian developmental state](https://en.wikipedia.org/wiki/Developmental_state) — pioneered by postwar Japan through MITI and the keiretsu system, extended by South Korea under Park Chung-hee, and refined by Taiwan and Singapore — characterized by elite technocratic planning, state-guided finance, and export-oriented industrial policy. [Reform-era China](https://en.wikipedia.org/wiki/Chinese_economic_reform) since 1978 has combined Deng Xiaoping's opening with continued party-state direction, producing four decades of rapid development through selective market liberalization and strategic industrial policy. Historically, the [Meiji Restoration](https://en.wikipedia.org/wiki/Meiji_Restoration) was the first non-Western project of this kind — 19th-century Japan adopting Western industrial and military technologies while building a strong centralized state.",
    prototype: [0.0, 0.7, 0.75, 0.65, 0.6, 0.6, 0.15, 0.6, 0.2, 0.55, 0.2, 0.4],
    displayOrder: 10,
    emergence: "refined",
  },
  {
    id: "nationalist-populist",
    name: "The Nationalist Populist",
    summary:
      "Sovereignty-oriented and culturally cohesive. Deeply skeptical of elites, experts, and international bodies — trusts ordinary people's common sense over credentialed authority. Ambivalent about both state power and markets; rejects concentrated power in most of its forms.",
    description:
      "Strongly sovereignty-oriented and culturally cohesive. Deeply skeptical of both international institutions and domestic elites — trusts the common sense of ordinary people over credentialed expertise. Favors cultural continuity and traditional values over rapid progressive change. Ambivalent about both state power and markets: distrusts government and business establishments alike, and does not treat either as a natural ally. Non-interventionist abroad — \"our people first\" rather than expansionist. Cautious about technology that disrupts familiar ways of life.",
    characteristicTension:
      "Distrust of concentrated power cuts across all directions — state, market, expert, international — leaving few institutions intact to act through. A politics of suspicion is easier to sustain than a politics of construction.",
    traditions:
      "This orientation has a long historical pedigree in the US [People's Party](https://en.wikipedia.org/wiki/People%27s_Party_\\(United_States\\)) of the 1890s, which gave populism its name — combining small-producer economics, anti-elite rhetoric against banks and Washington, and grassroots democratic organizing. In contemporary Europe, the [Five Star Movement](https://en.wikipedia.org/wiki/Five_Star_Movement) in Italy built electoral power by refusing left-right categorization, demanding direct democracy, and opposing the political *caste*. The [Yellow Vests](https://en.wikipedia.org/wiki/Yellow_vests_protests) in France combined anti-elite sentiment with opposition to technocratic taxation and calls for direct democracy, drawing from across the political spectrum in a way that defied conventional mapping.",
    prototype: [-0.2, 0.4, -0.2, -0.55, 0.0, 0.0, 0.6, 0.7, 0.6, 0.7, -0.1, -0.25],
    displayOrder: 11,
    emergence: "refined",
  },
  {
    id: "authoritarian-traditionalist",
    name: "The Authoritarian Traditionalist",
    summary:
      "Favors strong centralized authority, cultural cohesion, traditional values, and robust security. Performance-oriented; distrustful of democratic process as chaotic. Sovereignty-focused and moderately interventionist.",
    description:
      "Favors strong centralized authority, cultural cohesion, traditional values, and robust security. Essentialist view of human nature. Performance-legitimacy oriented — distrustful of democratic process as chaotic and corrosive to social order. Moderately interventionist and sovereignty-focused. Somewhat precautionary toward technology that disrupts social structures. Populist in rhetoric (claims to speak for \"the people\") but favors institutional authority in practice. Neutral to moderate on economics.",
    characteristicTension:
      "Claims to represent ordinary people's values while concentrating power in ways that limit ordinary people's agency.",
    traditions:
      "This orientation has serious intellectual foundations in [Catholic integralism](https://en.wikipedia.org/wiki/Integralism), which holds that political authority should serve substantive moral and spiritual ends rather than operate in a posture of liberal neutrality — a tradition with a significant contemporary revival through figures like Adrian Vermeule and Patrick Deneen. [Confucian political philosophy](https://en.wikipedia.org/wiki/Confucian_political_philosophy), with its emphasis on ordered authority, hierarchical roles, and moral paternalism, continues to inform contemporary non-liberal governance thought across East Asia. In practice, the orientation is expressed through [illiberal democracy](https://en.wikipedia.org/wiki/Illiberal_democracy), the political formation associated with Orbán's Hungary and Kaczyński's PiS-led Poland, explicitly framed by its architects as a coherent alternative to liberal democracy built on Christian national identity.",
    prototype: [0.0, 0.3, 0.8, -0.3, 0.8, 0.7, 0.9, 0.8, 0.8, 0.6, 0.4, -0.2],
    displayOrder: 12,
    emergence: "theoretical",
  },
];
