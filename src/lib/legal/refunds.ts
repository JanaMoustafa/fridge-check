import { PRO_PERIOD_DAYS, PRO_PRICE_EGP } from '@/lib/billing/plan'
import type { Locale } from '@/lib/i18n/locale'
import { EMAIL_LINK, LEGAL_PATHS, REFUND_WINDOW_DAYS, type LegalDocument } from './document'

/** Working days within which a refund request gets an answer. */
const REPLY_WORKING_DAYS = 5

const en: LegalDocument = {
  title: 'Refund policy',
  description: `A full refund within ${REFUND_WINDOW_DAYS} days of paying for Fridge Check Pro.`,
  intro: `Changed your mind about Fridge Check Pro? You can get your money back in full within ${REFUND_WINDOW_DAYS} days of paying, for any reason.`,
  sections: [
    {
      id: 'window',
      heading: `${REFUND_WINDOW_DAYS}-day full refund`,
      blocks: [
        `Ask within ${REFUND_WINDOW_DAYS} days of a payment and we refund the full ${PRO_PRICE_EGP} EGP. You don’t need to give a reason.`,
        `Each payment counts on its own: if you paid again to add ${PRO_PERIOD_DAYS} days, you can ask for that payment back within ${REFUND_WINDOW_DAYS} days of making it.`,
      ],
    },
    {
      id: 'how',
      heading: 'How to ask',
      blocks: [
        `Email ${EMAIL_LINK} from the email address of your Fridge Check account (or tell us which address it is), with the date you paid. We reply within ${REPLY_WORKING_DAYS} working days.`,
      ],
    },
    {
      id: 'next',
      heading: 'What happens next',
      blocks: [
        {
          list: [
            'We refund through XPay, normally to the card or payment method you used.',
            'How long the money takes to reach you depends on your bank or payment method.',
            `A refund removes the Pro days that payment bought: if it was your only pass, Pro ends straight away; if it added ${PRO_PERIOD_DAYS} days, only those days are removed.`,
          ],
        },
      ],
    },
    {
      id: 'after',
      heading: `After ${REFUND_WINDOW_DAYS} days`,
      blocks: [
        `After ${REFUND_WINDOW_DAYS} days we don’t refund the remaining days of a pass, except when:`,
        {
          list: [
            'you were charged twice for the same pass, or paid without getting Pro and we can’t fix it;',
            'we stop offering Pro, or suspend your account through no fault of yours (we refund the unused days);',
            'the law requires a refund.',
          ],
        },
      ],
    },
    {
      id: 'cancelling',
      heading: 'Cancelling',
      blocks: [
        `Pro never renews by itself, so there is nothing to cancel to avoid future charges. Turning off renewal reminders on your account page doesn’t refund anything; Pro simply runs until the end of what you paid for. Deleting your account ends Pro straight away, and you can still ask for a refund within the ${REFUND_WINDOW_DAYS} days. See also our [terms of use](${LEGAL_PATHS.terms}).`,
      ],
    },
  ],
}

const ar: LegalDocument = {
  title: 'سياسة الاسترداد',
  description: `استرداد كامل خلال ${REFUND_WINDOW_DAYS} يومًا من الدفع مقابل اشتراك Fridge Check Pro.`,
  intro: `غيّرت رأيك بشأن Fridge Check Pro؟ يمكنك استرداد أموالك كاملةً خلال ${REFUND_WINDOW_DAYS} يومًا من الدفع، لأي سبب.`,
  sections: [
    {
      id: 'window',
      heading: `استرداد كامل خلال ${REFUND_WINDOW_DAYS} يومًا`,
      blocks: [
        `اطلب الاسترداد خلال ${REFUND_WINDOW_DAYS} يومًا من الدفع، وسنرد لك ${PRO_PRICE_EGP} جنيه كاملة. لا تحتاج إلى ذكر السبب.`,
        `كل دفعة تُحتسب على حدة: إذا دفعت مجددًا لإضافة ${PRO_PERIOD_DAYS} يومًا، يمكنك طلب استرداد تلك الدفعة خلال ${REFUND_WINDOW_DAYS} يومًا من إجرائها.`,
      ],
    },
    {
      id: 'how',
      heading: 'كيف تطلب الاسترداد',
      blocks: [
        `راسلنا على ${EMAIL_LINK} من البريد الإلكتروني لحسابك في Fridge Check (أو أخبرنا به)، مع تاريخ الدفع. سنرد خلال ${REPLY_WORKING_DAYS} أيام عمل.`,
      ],
    },
    {
      id: 'next',
      heading: 'ماذا يحدث بعد ذلك',
      blocks: [
        {
          list: [
            'نرد المبلغ عبر XPay، عادةً إلى البطاقة أو وسيلة الدفع التي استخدمتها.',
            'تعتمد مدة وصول المبلغ إليك على البنك أو وسيلة الدفع.',
            `يُلغي الاسترداد أيام Pro التي دُفعت بها تلك الدفعة: إذا كانت اشتراكك الوحيد ينتهي Pro فورًا، وإذا كانت أضافت ${PRO_PERIOD_DAYS} يومًا تُحذف تلك الأيام فقط.`,
          ],
        },
      ],
    },
    {
      id: 'after',
      heading: `بعد ${REFUND_WINDOW_DAYS} يومًا`,
      blocks: [
        `بعد ${REFUND_WINDOW_DAYS} يومًا لا نرد قيمة الأيام المتبقية من الاشتراك، إلا في الحالات التالية:`,
        {
          list: [
            'إذا خُصم منك المبلغ مرتين للاشتراك نفسه، أو دفعت ولم تحصل على Pro ولم نتمكن من إصلاح ذلك؛',
            'إذا توقفنا عن تقديم Pro، أو أوقفنا حسابك دون خطأ منك (نرد قيمة الأيام غير المستخدمة)؛',
            'إذا فرض القانون الاسترداد.',
          ],
        },
      ],
    },
    {
      id: 'cancelling',
      heading: 'الإلغاء',
      blocks: [
        `لا يتجدد Pro تلقائيًا أبدًا، لذا لا حاجة إلى إلغاء أي شيء لتجنّب خصومات مستقبلية. إيقاف تذكيرات التجديد في صفحة حسابك لا يرد أي مبلغ، بل يستمر Pro حتى نهاية المدة التي دفعت مقابلها. وحذف حسابك يُنهي Pro فورًا، ويظل بإمكانك طلب الاسترداد خلال الأيام الـ ${REFUND_WINDOW_DAYS}. انظر أيضًا [شروط الاستخدام](${LEGAL_PATHS.terms}).`,
      ],
    },
  ],
}

export const refundPolicy: Record<Locale, LegalDocument> = { en, ar }
