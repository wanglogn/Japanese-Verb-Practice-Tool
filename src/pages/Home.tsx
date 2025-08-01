import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function Home() {
  const [activeTab, setActiveTab] = useState("tab1");
  const [verbInput, setVerbInput] = useState("");
  const [practiceVerb, setPracticeVerb] = useState("");
  const [conjugationResult, setConjugationResult] = useState<Record<
    string,
    string
  > | null>(null);
  const [verbType, setVerbType] = useState("");
  const [practiceType, setPracticeType] = useState("");
  const [practiceQuestions, setPracticeQuestions] = useState<
    Array<{ form: string; answer: string }>
  >([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showPracticeArea, setShowPracticeArea] = useState(false);
  const [feedback, setFeedback] = useState("");

  // 切换标签页
  const switchTab = (id: string) => {
    setActiveTab(id);
  };

  // 动词类型判定函数 - 优化版本
  const detectVerbType = (verb: string): string => {
    if (typeof verb !== "string" || verb.length === 0) return "";

    // 特殊五段动词集合（虽然以「る」结尾但实际是五段动词）
    const exceptionalGodan = new Set([
      "入る",
      "走る",
      "知る",
      "帰る",
      "要る",
      "切る",
      "限る",
      "減る",
      "喋る",
      "滑る",
      "焦る",
      "握る",
      "蹴る",
      "交じる",
      "混じる",
      "遮る",
      "滅入る",
      "参る",
      "覆る",
      "嘲る",
      "罵る",
      "照る",
      "捻る",
    ]);

    // 特殊一段动词集合（确保正确识别）
    const confirmedIchidan = new Set([
      "見る",
      "寝る",
      "出る",
      "食べる",
      "教える",
      "見せる",
      "受ける",
      "入れる",
      "変える",
      "始める",
      "続ける",
      "忘れる",
    ]);

    // サ変動詞
    if (verb === "する") return "サ変動詞";
    if (verb === "くる" || verb === "来る") return "カ変動詞";

    // 复合サ変動詞（～する）
    if (verb.endsWith("する")) {
      return "サ変動詞";
    }

    // 以「る」结尾的动词
    if (verb.endsWith("る")) {
      // 先检查特殊动词集合
      if (exceptionalGodan.has(verb)) return "五段動詞";
      if (confirmedIchidan.has(verb)) return "一段動詞";

      const preChar = verb.charAt(verb.length - 2);

      // 假名中用于判断是否为一段动词的音节（i段和e段）
      const ichidanKana = new Set([
        "い",
        "き",
        "し",
        "ち",
        "に",
        "ひ",
        "み",
        "り",
        "ぎ",
        "じ",
        "ぢ",
        "び",
        "ぴ",
        "え",
        "け",
        "せ",
        "て",
        "ね",
        "へ",
        "め",
        "れ",
        "げ",
        "ぜ",
        "で",
        "べ",
        "ぺ",
      ]);

      // 一段动词的判断标准是"前一个音为假名i段或e段 + る"
      if (ichidanKana.has(preChar)) return "一段動詞";

      return "五段動詞";
    }

    return "五段動詞"; // 默认情况
  };

  // 五段活用尾巴数据
  const godanEndings = {
    う: [
      "い",
      "って",
      "った",
      "わ",
      "え",
      "おう",
      "えば",
      "える",
      "われる",
      "わせる",
      "わせられる",
    ],
    く: [
      "き",
      "いて",
      "いた",
      "か",
      "け",
      "こう",
      "けば",
      "ける",
      "かれる",
      "かせる",
      "かせられる",
    ],
    ぐ: [
      "ぎ",
      "いで",
      "いだ",
      "が",
      "げ",
      "ごう",
      "げば",
      "げる",
      "がれる",
      "がせる",
      "がせられる",
    ],
    す: [
      "し",
      "して",
      "した",
      "さ",
      "せ",
      "そう",
      "せば",
      "せる",
      "される",
      "させる",
      "させられる",
    ],
    つ: [
      "ち",
      "って",
      "った",
      "た",
      "て",
      "とう",
      "てば",
      "てる",
      "たれる",
      "たせる",
      "たせられる",
    ],
    ぬ: [
      "に",
      "んで",
      "んだ",
      "な",
      "ね",
      "のう",
      "ねば",
      "ねる",
      "なれる",
      "なせる",
      "なせられる",
    ],
    ぶ: [
      "び",
      "んで",
      "んだ",
      "ば",
      "べ",
      "ぼう",
      "べば",
      "べる",
      "ばれる",
      "ばせる",
      "ばせられる",
    ],
    む: [
      "み",
      "んで",
      "んだ",
      "ま",
      "め",
      "もう",
      "めば",
      "める",
      "まれる",
      "ませる",
      "ませられる",
    ],
    る: [
      "り",
      "って",
      "った",
      "ら",
      "れ",
      "ろう",
      "れば",
      "れる",
      "られる",
      "らせる",
      "らせられる",
    ],
  };

  // 活用函数 - 优化版本
  const conjugateVerb = (
    verb: string
  ): Record<string, string> | { error: string } => {
    const type = detectVerbType(verb);

    // 复合サ変動詞（例如勉強する）
    if (type === "サ変動詞" && verb !== "する") {
      const base = verb.slice(0, -2); // 去除「する」
      return {
        type,
        基本形: verb,
        ます形: base + "します",
        て形: base + "して",
        た形: base + "した",
        ない形: base + "しない",
        命令形: base + "しろ",
        意志形: base + "しよう",
        ば形: base + "すれば",
        可能形: base + "できる",
        被动形: base + "される",
        使役形: base + "させる或いは" + base + "しろ",
        使役被动: base + "させられる",
      };
    }

    // 纯「する」
    if (verb === "する") {
      return {
        type,
        基本形: "する",
        ます形: "します",
        て形: "して",
        た形: "した",
        ない形: "しない",
        命令形: "しろ或いはせよ",
        意志形: "しよう",
        ば形: "すれば",
        可能形: "できる",
        被动形: "される",
        使役形: "させる",
        使役被动: "させられる",
      };
    }

    // カ変動詞（来る/くる）
    if (verb === "くる" || verb === "来る") {
      return {
        type,
        基本形: verb === "来る" ? "来る" : "くる",
        ます形: "きます",
        て形: "きて",
        た形: "きた",
        ない形: "こない",
        命令形: "こい",
        意志形: "こよう",
        ば形: "くれば",
        可能形: "こられる",
        被动形: "こられる",
        使役形: "こさせる",
        使役被动: "こさせられる",
      };
    }

    // 一段动词 - 优化版本
    if (type === "一段動詞") {
      // 对于一段动词，正确提取词干（去掉最后的「る」）
      const base = verb.slice(0, -1);

      // 特殊处理"見る"和"寝る"等常见一段动词
      if (verb === "見る") {
        return {
          type,
          基本形: "見る",
          ます形: "見ます",
          て形: "見て",
          た形: "見た",
          ない形: "見ない",
          命令形: "見ろ或いは見よ",
          意志形: "見よう",
          ば形: "見れば",
          可能形: "見られる",
          被动形: "見られる",
          使役形: "見させる",
          使役被动: "見させられる",
        };
      }

      if (verb === "寝る") {
        return {
          type,
          基本形: "寝る",
          ます形: "寝ます",
          て形: "寝て",
          た形: "寝た",
          ない形: "寝ない",
          命令形: "寝ろ或いは寝よ",
          意志形: "寝よう",
          ば形: "寝れば",
          可能形: "寝られる",
          被动形: "寝られる",
          使役形: "寝させる",
          使役被动: "寝させられる",
        };
      }

      // 通用一段动词活用规则
      return {
        type,
        基本形: verb,
        ます形: base + "ます",
        て形: base + "て",
        た形: base + "た",
        ない形: base + "ない",
        命令形: base + "ろ或いは" + base + "よ",
        意志形: base + "よう",
        ば形: base + "れば",
        可能形: base + "られる",
        被动形: base + "られる",
        使役形: base + "させる",
        使役被动: base + "させられる",
      };
    }

    // 五段动词
    if (type === "五段動詞") {
      const ending = verb.slice(-1);
      const base = verb.slice(0, -1);
      const endings = godanEndings[ending as keyof typeof godanEndings];

      if (!endings) {
        return { error: "対応できない動詞の語尾です。" };
      }

      const [i, te, ta, a, e, o, ba, kanou, ukemi, shieki, shiekiUkemi] =
        endings;

      return {
        type,
        基本形: verb,
        ます形: base + i + "ます",
        て形: base + te,
        た形: base + ta,
        ない形: base + a + "ない",
        命令形: base + e + "或いは" + base + o,
        意志形: base + o,
        ば形: base + ba,
        可能形: base + kanou,
        被动形: base + ukemi,
        使役形: base + shieki,
        使役被动: base + shiekiUkemi,
      };
    }

    return { error: "対応できない動詞形式です。" };
  };

  // 显示活用结果
  const showConjugation = () => {
    const verb = verbInput.trim();
    if (!verb) {
      toast.error("動詞を入力してください", {
        position: "top-center", // 位置控制
      });
      return;
    }

    const result = conjugateVerb(verb);
    setConjugationResult(result);

    if ("error" in result) {
      setVerbType(`エラー: ${result.error}`);
    } else {
      setVerbType(`動詞タイプ：${result.type}`);
    }
  };

  // 生成练习题
  const generatePractice = () => {
    const verb = practiceVerb.trim();
    if (!verb) {
      toast.error("練習用の動詞を入力してください");
      return;
    }

    const result = conjugateVerb(verb);
    if ("error" in result) {
      setPracticeType(`エラー: ${result.error}`);
      setShowPracticeArea(false);
      return;
    }

    setPracticeType(`動詞タイプ：${result.type}`);

    // 提取所有活用形（排除type属性）
    const forms: Array<{ form: string; answer: string }> = [];
    for (const key in result) {
      if (key !== "type" && key !== "error") {
        forms.push({
          form: key,
          answer: result[key as keyof typeof result] as string,
        });
      }
    }

    // 打乱顺序增加练习难度
    const shuffledForms = [...forms].sort(() => Math.random() - 0.5);
    setPracticeQuestions(shuffledForms);
    setUserAnswers({});
    setShowPracticeArea(true);
    setFeedback("");
  };

  // 处理答案变化
  const handleAnswerChange = (form: string, value: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [form]: value,
    }));
  };

  // 检查答案
  const checkAnswers = () => {
    let correctCount = 0;

    practiceQuestions.forEach((question) => {
      if (userAnswers[question.form]?.trim() === question.answer) {
        correctCount++;
      }
    });

    setFeedback(
      `正解数: ${correctCount}/${practiceQuestions.length}  ${
        correctCount === practiceQuestions.length
          ? "すごい！全問正解です！"
          : "引き続き練習しましょう！"
      }`
    );

    // 高亮显示错误答案
    if (correctCount < practiceQuestions.length) {
      toast.info(
        `練習結果: ${correctCount}/${practiceQuestions.length} 正解しました`
      );
    } else {
      toast.success("おめでとうございます！全問正解です！");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className=" mx-auto bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <header className="bg-blue-600 text-white p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">
            日本語動詞活用自動変換ツール
          </h1>
        </header>

        {/* 标签页导航 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => switchTab("tab1")}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
              activeTab === "tab1"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            動詞変形
          </button>
          <button
            onClick={() => switchTab("tab2")}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
              activeTab === "tab2"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-５00 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            変形練習
          </button>
        </div>

        {/* 标签页内容 */}
        <div className="p-6">
          {/* 动詞変形标签页 */}
          {activeTab === "tab1" && (
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="verbInput"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  動詞（辞書形）を入力:
                </label>
                <input
                  type="text"
                  id="verbInput"
                  value={verbInput}
                  onChange={(e) => setVerbInput(e.target.value)}
                  placeholder="例：書く、食べる、勉強する、見る、寝る"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={showConjugation}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  変形する
                </button>
              </div>

              {/* 动词类型显示 */}
              {verbType && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-medium">
                  {verbType}
                </div>
              )}

              {/* 结果表格 */}
              {conjugationResult && !("error" in conjugationResult) && (
                <div className="overflow-x-auto mt-6">
                  <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                          形式
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                          変形後
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(conjugationResult).map(
                        ([form, value]) => {
                          if (form === "type") return null;
                          return (
                            <tr
                              key={form}
                              className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150"
                            >
                              <td className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                                {form}
                              </td>
                              <td className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 font-medium text-blue-600 dark:text-blue-400">
                                {value}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 変形練習标签页 */}
          {activeTab === "tab2" && (
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="practiceVerb"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  動詞（辞書形）を入力:
                </label>
                <input
                  type="text"
                  id="practiceVerb"
                  value={practiceVerb}
                  onChange={(e) => setPracticeVerb(e.target.value)}
                  placeholder="例：話す、来る、する、見る、寝る"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={generatePractice}
                  className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  練習開始
                </button>
              </div>

              {/* 动词类型显示 */}
              {practiceType && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-medium">
                  {practiceType}
                </div>
              )}

              {/* 练习区域 */}
              {showPracticeArea && (
                <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    動詞活用練習
                  </h3>

                  <div className="space-y-4">
                    {practiceQuestions.map((question, index) => (
                      <div key={index} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {question.form}：
                        </label>
                        <input
                          type="text"
                          value={userAnswers[question.form] || ""}
                          onChange={(e) =>
                            handleAnswerChange(question.form, e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                          placeholder="入力してください..."
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={checkAnswers}
                    className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    チェック
                  </button>

                  {feedback && (
                    <div className="mt-4 p-3 bg-gray-1０0 dark:bg-gray-700 rounded-lg text-center text-gray-800 dark:text-gray-200 font-medium">
                      {feedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 页脚 */}
        <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6 text-center text-sm text-gray-600 dark:text-gray-400">
          日本語動詞活用自動変換ツール - 日本語学習に役立ててください
        </footer>
      </div>
    </div>
  );
}
