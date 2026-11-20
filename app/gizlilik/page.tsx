import Image from "next/image";
import Link from "next/link";

import FooterSection from "@/components/FooterSection";
import pogLogo from "../../public/images/pog-logo-navbar.png";

export const metadata = {
  title: "Gizlilik Politikası | POG",
  description: "POG web sitesi gizlilik politikası.",
};

const sections = [
  {
    title: "1. Veri sorumlusu",
    content: (
      <p>
        Bu politika, Dokuz Eylül Üniversitesi bünyesinde faaliyet gösteren
        Proje ve Oyun Geliştirme Topluluğu (POG) tarafından işletilen
        pog-website web sitesi için geçerlidir. Veri sorumlusu ve iletişim
        bilgileriyle ilgili sorularınız için{" "}
        <a
          href="mailto:iletisim.pog@gmail.com"
          className="font-semibold text-[#218bb9] hover:underline"
        >
          iletisim.pog@gmail.com
        </a>{" "}
        adresinden bize ulaşabilirsiniz.
      </p>
    ),
  },
  {
    title: "2. Hangi verileri topluyoruz?",
    content: (
      <>
        <p>
          Web sitemizi yalnızca bilgi edinmek amacıyla ziyaret ettiğinizde
          sizden doğrudan kişisel veri talep etmeyiz. İletişim kurmak için
          e-posta gönderdiğinizde veya bir etkinlik başvuru formunu
          doldurduğunuzda aşağıdaki bilgiler sağladığınız ölçüde işlenebilir:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Ad, soyad ve iletişim bilgileri,</li>
          <li>Etkinlik veya topluluk başvurunuzda paylaştığınız bilgiler,</li>
          <li>Mesajınızın içeriği ve bizimle yaptığınız yazışmalar.</li>
        </ul>
      </>
    ),
  },
  {
    title: "3. Verileri hangi amaçlarla kullanıyoruz?",
    content: (
      <>
        <p>
          Topladığımız bilgiler; taleplerinize yanıt vermek, etkinlik
          başvurularını değerlendirmek, etkinlikleri planlamak ve topluluk
          iletişimini yürütmek amacıyla kullanılır. Veriler, bu amaçlar için
          gerekli olan süre boyunca ve ilgili mevzuata uygun şekilde
          saklanır.
        </p>
        <p className="mt-4">
          Kişisel verilerinizi açık rızanız veya kanuni bir zorunluluk
          bulunmadıkça reklam, profil oluşturma ya da ilgisiz pazarlama
          amacıyla kullanmayız.
        </p>
      </>
    ),
  },
  {
    title: "4. Çerezler ve teknik kayıtlar",
    content: (
      <p>
        Sitemiz temel işlevlerini sunmak için gerekli olabilecek teknik
        kayıtları kullanabilir. Ziyaret sırasında IP adresi, tarayıcı türü ve
        erişim zamanı gibi bilgiler barındırma hizmeti tarafından güvenlik ve
        teknik süreklilik amacıyla kaydedilebilir. Bu site, ayrıca bir
        pazarlama çerezi kullanmamakla birlikte, bağlantı verdiğimiz üçüncü
        taraf hizmetlerin kendi çerez politikaları olabilir.
      </p>
    ),
  },
  {
    title: "5. Üçüncü taraf hizmetler",
    content: (
      <p>
        Etkinlik başvuruları veya iletişim için Google Forms, sosyal medya
        platformları ve benzeri üçüncü taraf hizmetlere yönlendirme
        yapılabilir. Bu hizmetlerde paylaştığınız bilgiler ilgili hizmetin
        kendi gizlilik politikasına tabidir. Bu sayfadan ayrıldıktan sonraki
        veri işleme faaliyetlerinden ilgili hizmet sağlayıcı sorumludur.
      </p>
    ),
  },
  {
    title: "6. Haklarınız",
    content: (
      <p>
        Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse
        bunlarla ilgili bilgi talep etme, yanlış veya eksik bilgilerin
        düzeltilmesini isteme, mevzuatın izin verdiği durumlarda silinmesini
        veya yok edilmesini talep etme ve işleme faaliyetlerine itiraz etme
        haklarına sahipsiniz. Taleplerinizi{" "}
        <a
          href="mailto:iletisim.pog@gmail.com"
          className="font-semibold text-[#218bb9] hover:underline"
        >
          iletisim.pog@gmail.com
        </a>{" "}
        adresine iletebilirsiniz. Talebinizi değerlendirirken kimliğinizi
        doğrulamak için ek bilgi isteyebiliriz.
      </p>
    ),
  },
  {
    title: "7. Politika değişiklikleri",
    content: (
      <p>
        Bu politika, hizmetlerimizde veya yürürlükteki mevzuatta meydana gelen
        değişikliklere göre güncellenebilir. Güncel metin her zaman bu
        sayfada yayımlanır. Son güncelleme tarihi: 20 Kasım 2026.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f7fbfd] text-[#1f2937]">
      <header className="border-b border-[#d7e8ef] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
          <Link href="/" aria-label="POG ana sayfası">
            <Image src={pogLogo} alt="POG" width={120} height={60} className="h-12 w-auto" />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[#218bb9] px-4 py-2 text-sm font-medium text-[#218bb9] transition hover:bg-[#218bb9] hover:text-white"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-20">
        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#218bb9]">
            POG
          </p>
          <h1 className="text-4xl font-bold text-[#082f49] md:text-5xl">
            Gizlilik Politikası
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#4f5353]">
            Kişisel verilerinizin güvenliği ve gizliliği bizim için önemlidir.
            Bu politika, web sitemizi kullanırken bilgilerinizin nasıl
            işlendiğini açıklar.
          </p>
        </div>

        <div className="space-y-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#d7e8ef] md:p-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-[#082f49]">{section.title}</h2>
              <div className="mt-3 leading-7 text-[#4f5353]">{section.content}</div>
            </section>
          ))}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
