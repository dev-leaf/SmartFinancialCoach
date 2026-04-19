import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, IconButton, ActivityIndicator, Chip } from 'react-native-paper';
import { useAuthStore, useExpenseStore, useBudgetStore } from '../../store';
import { useChatStore } from '../../store/chatStore';
import { CoachContext } from '../../utils/aiService';
import { spacing } from '../../theme/Theme';

const QUICK_ACTIONS = [
  "Analyze spending",
  "Saving tips",
  "Where did I spend most?",
  "Budget status"
];

export default function ChatScreen() {
  const { user } = useAuthStore();
  const { expenseMetrics } = useExpenseStore();
  const { summary: budgetSummary } = useBudgetStore();
  
  const { messages, isTyping, sendMessage, clearHistory } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Clear history implicitly when component unmounts for privacy
  useEffect(() => {
    return () => clearHistory();
  }, [clearHistory]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    setInputText('');

    const context: CoachContext = {
      expenseMetrics,
      budgetSummary,
      userName: user?.name
    };

    sendMessage(context, text.trim());
  };

  const renderMessage = ({ item }: { item: typeof messages[0] }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAI]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Text style={{ fontSize: 16 }}>🤖</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleAI]}>
          <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAI]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.typingText}>Coach is thinking...</Text>
          </View>
        )}

        <View style={styles.inputSection}>
          <View style={styles.quickActionsContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={QUICK_ACTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Chip 
                  style={styles.chip} 
                  textStyle={styles.chipText}
                  onPress={() => handleSend(item)}
                >
                  {item}
                </Chip>
              )}
            />
          </View>
          
          <View style={styles.inputRow}>
            <TextInput
              mode="outlined"
              placeholder="Ask anything..."
              value={inputText}
              onChangeText={setInputText}
              style={styles.input}
              outlineColor="#E0E0E0"
              activeOutlineColor="#2196F3"
              returnKeyType="send"
              onSubmitEditing={() => handleSend(inputText)}
            />
            <IconButton
              icon="send"
              iconColor={inputText.trim() ? '#2196F3' : '#BDBDBD'}
              size={28}
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim()}
              style={styles.sendBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  keyboardView: {
    flex: 1,
  },
  chatList: {
    padding: spacing.m,
    paddingBottom: spacing.l,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: spacing.m,
    maxWidth: '85%',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageWrapperAI: {
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
    marginBottom: 0,
  },
  messageBubble: {
    padding: spacing.s,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageBubbleUser: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  messageBubbleAI: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextAI: {
    color: '#333333',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
    gap: spacing.xs,
  },
  typingText: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.l : spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  quickActionsContainer: {
    marginBottom: spacing.xs,
  },
  chip: {
    marginHorizontal: spacing.xxs,
    backgroundColor: '#F0F7FF',
    borderColor: '#E3F2FD',
    borderWidth: 1,
  },
  chipText: {
    color: '#1565C0',
    fontSize: 13,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    height: 50,
  },
  sendBtn: {
    marginLeft: spacing.xxs,
    marginRight: 0,
  },
});
