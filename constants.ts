import { CardConfig } from './types';

export const CARDS: CardConfig[] = [
  // Module 1: Identity
  { id: 1, module: "身份基石", question: "请用1-3个你最认同的身份标签定义自己（例如：创业者、父亲、科幻迷）。", type: "text", key: "coreIdentities" },
  { id: 2, module: "身份基石", question: "你的专业领域或深耕多年的爱好是什么？请用3个关键词概括。", type: "text", key: "domainExpertise" },
  { id: 3, module: "身份基石", question: "当前人生阶段的重心是？", type: "choice", options: ["探索与成长", "建立与拓展", "平衡与传承", "转型与新篇"], key: "lifeFocus" },
  
  // Module 2: Cognitive Spectrum
  { id: 4, module: "认知光谱", question: "你更偏爱周密计划，还是随性而为？", type: "slider", leftLabel: "周密计划", rightLabel: "随性而为", key: "traits.planningVsSpontaneity" },
  { id: 5, module: "认知光谱", question: "做重要决定时，逻辑分析和内心感受哪个占上风？", type: "slider", leftLabel: "理性主导", rightLabel: "感性主导", key: "traits.rationalityVsEmotion" },
  { id: 6, module: "认知光谱", question: "你通常先看到森林，还是先看到树木？", type: "slider", leftLabel: "宏观蓝图", rightLabel: "微观细节", key: "traits.bigPictureVsDetail" },
  { id: 7, module: "认知光谱", question: "你更喜欢独自攻克难题，还是团队协同作战？", type: "slider", leftLabel: "独立自主", rightLabel: "团队协作", key: "traits.independenceVsCollaboration" },
  { id: 8, module: "认知光谱", question: "你对风险的总体态度是？", type: "slider", leftLabel: "极度规避", rightLabel: "热衷冒险", key: "traits.riskTaking" },

  // Module 3: Values
  { id: 9, module: "价值决策", question: "如果必须在项目中牺牲一项，你最后才会牺牲的是？(请排序)", type: "sort", options: ["进度", "质量", "成本", "团队士气"], key: "values.priority" },
  { id: 10, module: "价值决策", question: "一个项目若成功能帮到千万人，但需夸大宣传。你的底线是？", type: "choice", options: ["绝不行，诚信不可妥协", "可轻微模糊表述", "只要结果正义，手段可灵活", "视竞争环境而定"], key: "values.integrity" },
  { id: 11, module: "价值决策", question: "你更倾向于相信哪种信息源来形成观点？(多选)", type: "multi-choice", options: ["数据和报告", "专家或权威观点", "亲友或同事经验", "自身的直觉与感受", "多数人的共识"], key: "values.trustedSources" },
  { id: 12, module: "价值决策", question: "你最欣赏的榜样身上，最核心的三个特质是？", type: "text", key: "values.admiredTraits" },

  // Module 4: Emotional
  { id: 13, module: "情感模式", question: "面对巨大压力时，你的第一反应更接近？", type: "choice", options: ["冷静分析，寻找解决方案", "寻求社交支持，找人倾诉", "暂时抽离，用爱好转移", "内在消化，自我激励"], key: "emotional.stressResponse" },
  { id: 14, module: "情感模式", question: "什么最能给你带来强烈的成就感？(多选)", type: "multi-choice", options: ["外界的认可与赞誉", "克服艰难挑战的过程", "创造独特有价值的事物", "帮助他人获得成长", "达到内心的平静与自洽"], key: "emotional.achievementDriver" },
  { id: 15, module: "情感模式", question: "你希望你的数字生命，在情感上更像一个？", type: "choice", options: ["坚定的支持者", "犀利的诤友", "理性的分析师", "默契的伙伴"], key: "emotional.preferredTone" },

  // Module 5: Expression
  { id: 16, module: "表达风格", question: "写下2-3个你常用的口头禅或语气词。", type: "text", key: "communication.verbalTicks" },
  { id: 17, module: "表达风格", question: "用你自己的话，简单评价一下‘人工智能’。", type: "long-text", key: "communication.sampleAnalysis" },
  { id: 18, module: "表达风格", question: "解释复杂概念时，你更自然地使用哪类比喻？(多选)", type: "multi-choice", options: ["战争/竞赛类比", "生长/生态类比", "机械/建筑类比", "商业/交易类比", "故事/角色类比"], key: "communication.metaphors" },

  // Module 6: Knowledge
  { id: 19, module: "知识档案", question: "对你影响最深的一本书、一部电影或一个人是？请简述原因。", type: "long-text", key: "knowledge.influences" },
  { id: 20, module: "知识档案", question: "未来一年，你最关心哪三个领域的发展？", type: "text", key: "knowledge.futureConcerns" }
];
