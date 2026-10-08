import Image from "next/image";
import { ArrowUpRight, BrainCircuit, Code2, Leaf, Monitor, Bot } from "lucide-react";

// Display exact regions of the supplied artwork, preserving the original marks.
export function SchoolLogo({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="414 180 410 205" role="img" aria-label="AIR Foundation School System" focusable="false">
    <image href="/school-reference.jpg" width="1231" height="712" />
  </svg>;
}

const marks = [
  { name: "University of Cambridge", crop: "60 75 265 72" },
  { name: "Moody International and UKAS", crop: "334 75 158 77" },
  { name: "Edexcel", crop: "496 82 162 67" },
  { name: "The Aga Khan University", crop: "666 68 132 85" },
  { name: "STEMP21", crop: "807 68 115 84" },
  { name: "Microsoft Certified School mark", crop: "932 70 245 79" },
];

export function CampusShowcase({ ur }: { ur: boolean }) {
  return <section className="section campus-showcase" aria-labelledby="campus-title">
    <div className="campus-composition">
      <div className="student-stage">
        <span className="student-halo" aria-hidden="true" />
        <div className="student-caption"><span>{ur ? "ایک روشن آغاز" : "A BRIGHTER BEGINNING"}</span><strong>{ur ? "ہر بچے کے لیے۔" : "For every child."}</strong></div>
        <Image src="/air-students.webp" width={1024} height={1536} sizes="(max-width: 700px) 88vw, 44vw" alt={ur ? "اسکول کے فراہم کردہ پوسٹر سے تیار کردہ طلبہ کی تصویر" : "Student artwork adapted from the school’s supplied campus poster"} className="student-portrait" />
        <span className="student-tag">PHALIA CAMPUS</span>
      </div>
      <div className="campus-story">
        <p className="eyebrow">{ur ? "تعلیم، اعتماد اور کردار" : "EDUCATION. CONFIDENCE. CHARACTER."}</p>
        <h2 id="campus-title" className="school-title">{ur ? <>ایئر فاؤنڈیشن<br/>اسکول سسٹم</> : <>AIR FOUNDATION<br/><span>SCHOOL SYSTEM</span></>}</h2>
        <p className="campus-location">{ur ? "پھالیہ کیمپس" : "PHALIA CAMPUS"}</p>
        <p className="campus-intro">{ur ? "پہلے قدم سے اگلی منزل تک۔ پری اسکول، جونیئر کیمپس اور ہائی اسکول کے تعلیمی سفر کو جانیے اور اپنے بچے کے لیے اگلے مرحلے کی منصوبہ بندی کریں۔" : "From their first steps to their next chapter. Discover preschool, junior and high school education, and explore the possibilities for your child at AIR Phalia."}</p>
        <div className="campus-levels">{(ur ? ["پری اسکول", "جونیئر کیمپس", "ہائی اسکول"] : ["Pre School", "Junior Campus", "High School"]).map((level, i) => <span key={level}><small>0{i + 1}</small>{level}</span>)}</div>
        <a className="btn" href="#admissions">{ur ? "اپنے بچے کا اگلا قدم" : "Start their next chapter"}<ArrowUpRight size={18}/></a>
        <p className="campus-address">{ur ? "مگھو پنڈی روڈ، عید گاہ کے قریب، پھالیہ" : "Mugho Pindi Road · Near Eid Gah, Phalia"}</p>
      </div>
    </div>
    <div className="school-marks">
      <p className="marks-heading">{ur ? "اسکول کے تعارفی مواد میں درج لوگوز" : "MARKS FEATURED IN THE SCHOOL’S INTRODUCTORY MATERIAL"}</p>
      <div className="marks-grid">{marks.map(mark => { const [x, y, width, height] = mark.crop.split(" ").map(Number); return <div className="mark-tile" key={mark.name}><svg viewBox={mark.crop} role="img" aria-label={mark.name} focusable="false"><svg x={x} y={y} width={width} height={height} viewBox={mark.crop} overflow="hidden"><image href="/school-reference.jpg" width="1231" height="712" /></svg></svg></div>; })}</div>
      <p className="marks-note">{ur ? "کیمپس سے موجودہ وابستگیوں اور سرٹیفیکیشن کی تفصیل حاصل کریں۔" : "For details of current affiliations and certifications, please contact the campus."}</p>
    </div>
  </section>;
}

const pathways = [
  { icon: Monitor, en: "Discover", ur: "دریافت", caption: "Digital foundations", ucaption: "ڈیجیٹل بنیاد" },
  { icon: Bot, en: "Create", ur: "تخلیق", caption: "Robotics & coding", ucaption: "روبوٹکس اور کوڈنگ" },
  { icon: BrainCircuit, en: "Innovate", ur: "جدت", caption: "AI & future skills", ucaption: "اے آئی اور مستقبل کی مہارتیں" },
];

export function LearningVisual({ ur }: { ur: boolean }) {
  return <div className="learning-studio">
    <div className="studio-copy"><p className="eyebrow">{ur ? "اسکول کے تعلیمی منصوبے سے" : "INSPIRED BY THE SCHOOL’S LEARNING PLAN"}</p><h3>{ur ? <>تجسس سے<br/><em>تخلیق تک۔</em></> : <>Curiosity becomes<br/><em>possibility.</em></>}</h3><p>{ur ? "ٹیکنالوجی، عملی منصوبے اور پائیدار سوچ — مستقبل کی تعلیم کا وژن۔" : "Technology, hands-on projects and sustainable thinking. A connected vision for tomorrow’s learning."}</p><div className="studio-topics"><span><Code2 size={16}/>{ur ? "پروگرامنگ" : "Programming"}</span><span><Leaf size={16}/>{ur ? "پائیدار ترقی" : "Sustainability"}</span></div></div>
    <div className="pathway-visual" aria-label={ur ? "ڈیجیٹل، روبوٹکس اور اے آئی کا تعلیمی منصوبہ" : "Digital, robotics and AI learning pathway"}>{pathways.map((path, i) => <div className="pathway-node" key={path.en}><span className="node-index">0{i + 1}</span><div className="node-icon"><path.icon size={44} strokeWidth={1.4}/></div><strong>{ur ? path.ur : path.en}</strong><small>{ur ? path.ucaption : path.caption}</small></div>)}</div>
  </div>;
}
