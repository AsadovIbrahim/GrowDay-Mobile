import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Keyboard,
  Dimensions,
  Modal
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faPaperPlane, faLightbulb, faBrain, faStar } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { storage, getAiMentorRemainingMessagesKey, getAiMentorLastActiveDateKey, getAiMentorChatHistoryKey } from "../../utils/MMKVStore";
import { aiMentorChatFetch, aiMentorRemainingFetch } from "../../utils/fetch";
import { useMMKVString } from "react-native-mmkv";
import { getLocalMoodHistory } from "../../utils/MoodLocalStore";


import LinearGradient from "react-native-linear-gradient";

const AIMentorChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const { t, i18n } = useTranslation();
  const [token] = useMMKVString("accessToken");

  // AI Mentor Tutorial states and refs
  const [isTutorialActive, setIsTutorialActive] = useState(() => !storage.getBoolean("user.mentor_tutorial_completed"));
  const [tutorialStep, setTutorialStep] = useState(0);
  const [activeLayout, setActiveLayout] = useState(null);

  const limitBadgeRef = useRef(null);
  const quickPromptsRef = useRef(null);
  const inputBarRef = useRef(null);

  // Auto-measure target components when tutorial step changes
  useEffect(() => {
    if (isTutorialActive) {
      // Clear layout instantly to prevent stale coordinates highlight jump
      setActiveLayout(null);

      const delay = tutorialStep === 0 ? 800 : 80;
      const timer = setTimeout(() => {
        let activeRef = null;
        if (tutorialStep === 0) activeRef = quickPromptsRef;
        else if (tutorialStep === 1) activeRef = limitBadgeRef;
        else if (tutorialStep === 2) activeRef = inputBarRef;

        if (activeRef && activeRef.current) {
          activeRef.current.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
              setActiveLayout({ x, y, width, height });
            }
          });
        }
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setActiveLayout(null);
    }
  }, [tutorialStep, isTutorialActive]);

  const getTutorialText = (step) => {
    const lang = i18n.language || "en";
    const isAz = lang.substring(0, 2) === "az";
    const isTr = lang.substring(0, 2) === "tr";
    const isRu = lang.substring(0, 2) === "ru";

    if (step === 0) {
      if (isAz) return "Sürətli sual şablonları ilə AI Mentora bir kliklə sual verə bilərsiniz!";
      if (isTr) return "Hızlı soru şablonlarıyla yapay zeka mentörüne tek tıkla soru sorabilirsiniz!";
      if (isRu) return "Задайте вопрос ИИ-Ментору в один клик с помощью быстрых шаблонов!";
      return "Ask the AI Mentor with one click using quick prompt templates!";
    } else if (step === 1) {
      if (isAz) return "Gündəlik pulsuz mesaj limitinizi buradan izləyə bilərsiniz.";
      if (isTr) return "Günlük ücretsiz mesaj limitinizi buradan takip edebilirsiniz.";
      if (isRu) return "Отслеживайте свой ежедневный лимит бесплатных сообщений здесь.";
      return "Track your daily free AI messages limit here.";
    } else {
      if (isAz) return "Yaxud bura toxunaraq tamamilə özünüzə aid sualları yazıb göndərə bilərsiniz!";
      if (isTr) return "Veya buraya dokunarak tamamen kendi özel sorularınızı yazıp gönderin!";
      if (isRu) return "Или нажмите здесь, чтобы написать и отправить свои собственные вопросы!";
      return "Or type your custom questions here and start chatting!";
    }
  };

  const getTutorialButtonText = (step) => {
    const lang = i18n.language || "en";
    const isAz = lang.substring(0, 2) === "az";
    const isTr = lang.substring(0, 2) === "tr";
    const isRu = lang.substring(0, 2) === "ru";

    if (step < 2) {
      if (isAz) return "Növbəti >";
      if (isTr) return "Sonraki >";
      if (isRu) return "Далее >";
      return "Next >";
    } else {
      if (isAz) return "Söhbətə Başla 🌱";
      if (isTr) return "Sohbete Başla 🌱";
      if (isRu) return "Начать чат 🌱";
      return "Start Chatting 🌱";
    }
  };

  const screenHeight = Dimensions.get("screen").height;
  const windowHeight = Dimensions.get("window").height;
  const navBarHeight = screenHeight - windowHeight;

  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(5);
  const [errorText, setErrorText] = useState("");

  const flatListRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const params = route.params;
    if (params?.initialPrompt) {
      setInputMessage(params.initialPrompt);
      navigation.setParams({ initialPrompt: undefined });
    }
  }, [route.params, navigation]);

  // Gündəlik limiti yükləyirik
  const syncRemainingMessages = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const lastDate = storage.getString(getAiMentorLastActiveDateKey(token));
      let remaining = storage.getNumber(getAiMentorRemainingMessagesKey(token));

      if (lastDate !== today) {
        remaining = 5;
        storage.set(getAiMentorRemainingMessagesKey(token), 5);
        storage.set(getAiMentorLastActiveDateKey(token), today);
      } else if (remaining === undefined || isNaN(remaining)) {
        remaining = 5;
        storage.set(getAiMentorRemainingMessagesKey(token), 5);
      }
      setRemainingMessages(remaining);

      if (token) {
        const res = await aiMentorRemainingFetch(token);
        if (res && res.success && typeof res.data === 'number') {
          storage.set(getAiMentorRemainingMessagesKey(token), res.data);
          storage.set(getAiMentorLastActiveDateKey(token), today);
          setRemainingMessages(res.data);
        }
      }
    } catch (e) {
      console.log("Error syncing limit:", e);
      setRemainingMessages(5);
    }
  }, [token]);

  // Söhbət tarixçəsini yükləyirik
  useEffect(() => {
    syncRemainingMessages();
    try {
      const savedHistory = storage.getString(getAiMentorChatHistoryKey(token));
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        const normalized = Array.isArray(parsed)
          ? parsed.map((m) =>
            m?.id === "welcome-1"
              ? { ...m, text: t("ai_mentor.card_subtitle", "Ask me anything about your habits") }
              : m
          )
          : [];
        setMessages(normalized);
        storage.set(getAiMentorChatHistoryKey(token), JSON.stringify(normalized));
      } else {
        // İlk salamlaşma mesajı
        const welcomeMessage = {
          id: "welcome-1",
          text: t("ai_mentor.card_subtitle", "Ask me anything about your habits"),
          sender: "ai",
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
        storage.set(getAiMentorChatHistoryKey(token), JSON.stringify([welcomeMessage]));
      }
    } catch (e) {
      console.log("Error loading chat history:", e);
    }
  }, [t, token, syncRemainingMessages]);

  // Dil dəyişəndə salamlaşma mesajını yenilə (köhnə dildə qalmaması üçün)
  useEffect(() => {
    setMessages((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      const next = prev.map((m) =>
        m?.id === "welcome-1"
          ? { ...m, text: t("ai_mentor.card_subtitle", "Ask me anything about your habits") }
          : m
      );
      try {
        storage.set(getAiMentorChatHistoryKey(token), JSON.stringify(next));
      } catch { }
      return next;
    });
  }, [i18n.language, t, token]);

  // Mesaj siyahısı dəyişəndə avtomatik scroll-down
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    if (remainingMessages <= 0) {
      setErrorText(t("ai_mentor.limit_reached", "Daily limit reached. Come back tomorrow!"));
      return;
    }

    setInputMessage("");
    setErrorText("");
    Keyboard.dismiss();

    const userMessage = {
      id: `user-${Date.now()}`,
      text: text,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    storage.set(getAiMentorChatHistoryKey(token), JSON.stringify(updatedMessages));
    scrollToBottom();

    setIsTyping(true);

    try {
      // Fetch user's local mood history to inject into prompt context (fallback for production)
      const localMoods = getLocalMoodHistory(token);
      let moodContextStr = "";
      if (localMoods && localMoods.length > 0) {
        const moodListStr = localMoods
          .slice(0, 14)
          .map(e => `${e.date}: ${e.emoji} (${e.mood})`)
          .join(", ");
        moodContextStr = `\n\n[System Context - User's local mood history (last 14 days): ${moodListStr}. Use this context to analyze mood trends, correlation to habits, and customize your advice/motivation.]`;
      }

      // Backend tarixçə formatını qururuq (sistem mesajı xaric)
      const historyPayload = updatedMessages
        .filter(m => m.id !== "welcome-1")
        .slice(-6) // Yalnız son 6 mesajı tarixçə olaraq göndəririk (sürət üçün)
        .map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      // API call with injected mood context
      const res = await aiMentorChatFetch(token, text + moodContextStr, historyPayload);

      if (res && res.success && res.data) {
        const aiMessage = {
          id: `ai-${Date.now()}`,
          text: res.data.response,
          sender: "ai",
          timestamp: new Date().toISOString(),
        };

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        storage.set(getAiMentorChatHistoryKey(token), JSON.stringify(finalMessages));

        // Limit yenilənməsi
        storage.set(getAiMentorRemainingMessagesKey(token), res.data.remainingMessages);
        setRemainingMessages(res.data.remainingMessages);
      } else {
        const errorMsg = res?.message || t("ai_mentor.error", "Failed to get response. Please try again.");
        if (errorMsg === "DAILY_LIMIT_REACHED") {
          setErrorText(t("ai_mentor.limit_reached"));
          setRemainingMessages(0);
          storage.set(getAiMentorRemainingMessagesKey(token), 0);
        } else {
          setErrorText(errorMsg);
        }
      }
    } catch (e) {
      console.log("Error calling AI Mentor:", e);
      setErrorText(t("ai_mentor.error", "Failed to get response. Please try again."));
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const clearHistory = () => {
    const welcomeMessage = {
      id: "welcome-1",
      text: t("ai_mentor.card_subtitle", "Ask me anything about your habits"),
      sender: "ai",
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
    storage.set(getAiMentorChatHistoryKey(token), JSON.stringify([welcomeMessage]));
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.sender === "user";
    return (
      <View className={`flex-row my-2 px-4 ${isUser ? "justify-end" : "justify-start"}`}>
        {!isUser && (
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-2 mt-1"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <FontAwesomeIcon icon={faBrain} size={14} color="#ffffff" />
          </View>
        )}
        <View
          style={{
            backgroundColor: isUser ? colors.primary : colors.cardSecondary,
            maxWidth: "75%",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: isUser ? 16 : 4,
            borderBottomRightRadius: isUser ? 4 : 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Text
            className="text-[14px] leading-5"
            style={{ color: isUser ? "#ffffff" : colors.text }}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const quickPrompts = [
    { label: t("ai_mentor.quick_motivate", "Motivate me"), icon: faStar, prompt: t("ai_mentor.prompt_motivate", "Motivate me for today!") },
    { label: t("ai_mentor.quick_habit", "Habit advice"), icon: faLightbulb, prompt: t("ai_mentor.prompt_habit", "What habits do you suggest to increase my productivity?") },
    { label: t("ai_mentor.quick_plan", "Plan my day"), icon: faBrain, prompt: t("ai_mentor.prompt_plan", "Help me prepare a great day plan!") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 border-b"
        style={{ backgroundColor: colors.card, borderColor: colors.border, paddingTop: 10 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
          </TouchableOpacity>

          <View className="ml-2">
            <Text className="font-bold text-lg" style={{ color: colors.text }}>
              {t("ai_mentor.chat_header", "AI Mentor")}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
              <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                Online
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons / Badges */}
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={clearHistory}
            className="px-2.5 py-1 rounded-md border mr-3"
            style={{ borderColor: colors.border }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
              {t("ai_mentor.clear_history", "Clear")}
            </Text>
          </TouchableOpacity>

          <View
            ref={limitBadgeRef}
            className="px-2.5 py-1 rounded-full"
            style={{ backgroundColor: colors.primarySurface }}
          >
            <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>
              {t("ai_mentor.remaining_badge", { remaining: remainingMessages })}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Chat View */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          className="flex-1 pt-2"
          contentContainerStyle={{ paddingBottom: 15 }}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        {/* Error Text Banner */}
        {errorText ? (
          <View className="bg-red-50 dark:bg-red-950/20 px-4 py-2 border-y border-red-100 dark:border-red-900/30">
            <Text className="text-xs text-red-500 text-center font-medium">
              {errorText}
            </Text>
          </View>
        ) : null}

        {/* Typing indicator */}
        {isTyping && (
          <View className="flex-row my-2 px-4 justify-start items-center">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <FontAwesomeIcon icon={faBrain} size={14} color="#ffffff" />
            </View>
            <View
              className="rounded-2xl px-4 py-3 justify-center items-center flex-row"
              style={{ backgroundColor: colors.cardSecondary }}
            >
              <ActivityIndicator size="small" color={colors.primary} className="mr-2" />
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {t("ai_mentor.typing", "AI is thinking...")}
              </Text>
            </View>
          </View>
        )}

        {/* Quick Action Chips */}
        {messages.length <= 1 && !isTyping && (
          <View ref={quickPromptsRef} className="py-2.5">
            <Text className="text-center text-xs font-semibold mb-2" style={{ color: colors.textMuted }}>
              {t("ai_mentor.select_prompt", "Select one to start the conversation:")}
            </Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={quickPrompts}
              contentContainerStyle={{ paddingHorizontal: 12 }}
              keyExtractor={(item) => item.prompt}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleSendMessage(item.prompt)}
                  className="mx-1 px-4 py-2.5 rounded-full flex-row items-center border shadow-sm"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }}
                >
                  <FontAwesomeIcon icon={item.icon} size={13} color={colors.primary} />
                  <Text className="ml-1.5 text-xs font-bold" style={{ color: colors.text }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input Bar */}
        <View
          ref={inputBarRef}
          className="flex-row items-center px-4 pt-3 border-t"
          style={{ 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            paddingBottom: 12
          }}
        >
          <TextInput
            placeholder={
              remainingMessages <= 0
                ? t("ai_mentor.limit_reached")
                : t("ai_mentor.input_placeholder", "Type your message...")
            }
            placeholderTextColor={colors.placeholder}
            className="flex-1 px-4 py-2.5 rounded-full border text-[14px]"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.text,
            }}
            value={inputMessage}
            onChangeText={setInputMessage}
            editable={!isTyping && remainingMessages > 0}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            disabled={isTyping || !inputMessage.trim() || remainingMessages <= 0}
            onPress={() => handleSendMessage()}
            className="ml-3 p-3 rounded-full items-center justify-center"
            style={{
              backgroundColor:
                !inputMessage.trim() || isTyping || remainingMessages <= 0
                  ? colors.border
                  : colors.primary,
            }}
          >
            <FontAwesomeIcon
              icon={faPaperPlane}
              size={16}
              color={
                !inputMessage.trim() || isTyping || remainingMessages <= 0
                  ? colors.textMuted
                  : "#ffffff"
              }
            />
          </TouchableOpacity>
        </View>
        {Platform.OS === "android" && (
          <View style={{ height: keyboardHeight > 0 ? keyboardHeight - insets.bottom + navBarHeight + 45 : 0 }} />
        )}
      </KeyboardAvoidingView>

      {/* Full-Screen AI Mentor Tutorial Overlay */}
      <Modal
        visible={isTutorialActive && activeLayout !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)" }}>
          {/* Highlight step 0: Quick action prompts */}
          {tutorialStep === 0 && activeLayout && (
            <View
              style={{
                position: "absolute",
                left: activeLayout.x,
                top: activeLayout.y,
                width: activeLayout.width,
                height: activeLayout.height,
                backgroundColor: colors.card,
                borderColor: colors.primary,
                borderWidth: 1.5,
                borderRadius: 20,
                paddingVertical: 10,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                zIndex: 10000,
              }}
            >
              <View style={{ flexDirection: "row", paddingHorizontal: 12, gap: 8 }}>
                {quickPrompts.map((p, idx) => (
                  <View
                    key={idx}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                  >
                    <FontAwesomeIcon icon={p.icon} size={13} color={colors.primary} />
                    <Text style={{ marginLeft: 6, fontSize: 12, fontFamily: "RedditSans-Bold", color: colors.text }}>
                      {p.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Highlight step 1: Free limit badge */}
          {tutorialStep === 1 && activeLayout && (
            <View
              style={{
                position: "absolute",
                left: activeLayout.x,
                top: activeLayout.y,
                width: activeLayout.width,
                height: activeLayout.height,
                backgroundColor: colors.primarySurface,
                borderColor: colors.primary,
                borderWidth: 1.5,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                zIndex: 10000,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: "RedditSans-Bold", color: colors.primary }}>
                {t("ai_mentor.remaining_badge", { remaining: remainingMessages })}
              </Text>
            </View>
          )}

          {/* Highlight step 2: Custom input text bar */}
          {tutorialStep === 2 && activeLayout && (
            <View
              style={{
                position: "absolute",
                left: activeLayout.x,
                top: activeLayout.y,
                width: activeLayout.width,
                height: activeLayout.height,
                backgroundColor: colors.card,
                borderColor: colors.primary,
                borderWidth: 1.5,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                zIndex: 10000,
              }}
            >
              <TextInput
                editable={false}
                placeholder={t("ai_mentor.input_placeholder", "Type your message...")}
                placeholderTextColor={colors.placeholder}
                className="flex-1 px-4 py-2.5 rounded-full border text-[14px]"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </View>
          )}

          {/* Tutorial Bubble spoken by Growy */}
          {activeLayout && (
            <View
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 10,
                zIndex: 10001,
                ...(tutorialStep === 1
                  ? { top: activeLayout.y + activeLayout.height + 16 }
                  : { bottom: (Dimensions.get("window").height - activeLayout.y) + 16 }),
              }}
            >
              {/* Growy Avatar Header */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(16, 185, 129, 0.12)", alignItems: "center", justifyContent: "center" }}>
                    <FontAwesomeIcon icon={faBrain} size={12} color="#10b981" />
                  </View>
                  <Text style={{ fontSize: 12, fontFamily: "RedditSans-Bold", color: "#10b981", letterSpacing: 0.5 }}>
                    AI Mentor
                  </Text>
                </View>
                {/* Steps indicators */}
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: i === tutorialStep ? 16 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i <= tutorialStep ? "#10b981" : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"),
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* Instruction dialogue text */}
              <Text style={{ fontFamily: "RedditSans-Medium", fontSize: 14, lineHeight: 20, color: colors.text, marginBottom: 16 }}>
                {getTutorialText(tutorialStep)}
              </Text>

              {/* Action buttons */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <TouchableOpacity
                  onPress={() => {
                    if (tutorialStep < 2) {
                      setTutorialStep(tutorialStep + 1);
                    } else {
                      storage.set("user.mentor_tutorial_completed", true);
                      setIsTutorialActive(false);
                    }
                  }}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ color: "#ffffff", fontFamily: "RedditSans-Bold", fontSize: 14 }}>
                    {getTutorialButtonText(tutorialStep)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default AIMentorChatScreen;
