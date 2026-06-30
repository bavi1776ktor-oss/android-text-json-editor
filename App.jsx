import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';

function App() {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('Файл не выбран');
  const [fileUri, setFileUri] = useState(null);
  
  // Состояния для поиска
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const inputRef = useRef(null);

  // Логика поиска при изменении текста запроса
  useEffect(() => {
    if (!searchQuery || !text) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const lines = text.split('\n');
    const matches = [];
    const lowerQuery = searchQuery.toLowerCase();

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(lowerQuery)) {
        matches.push(index);
      }
    });

    setSearchMatches(matches);
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [searchQuery, text]);

  // Выбор и чтение файла через SAF
  const openFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.plainText, 'application/json'],
      });

      setFileName(res.name || 'document.txt');
      setFileUri(res.uri);

      // Чтение содержимого файла
      const response = await fetch(res.uri);
      let fileText = await response.text();

      // Если файл JSON, форматируем его с отступами для читаемости
      if (res.name?.endsWith('.json') || res.type === 'application/json') {
        try {
          const parsed = JSON.parse(fileText);
          fileText = JSON.stringify(parsed, null, 2);
        } catch (e) {
          // Если JSON не валиден, оставляем как текст
        }
      }

      setText(fileText);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Ошибка', 'Не удалось открыть файл');
      }
    }
  };

  // Сохранение файла обратно по Uri
  const saveFile = async () => {
    if (!fileUri) {
      Alert.alert('Внимание', 'Сначала откройте файл для редактирования');
      return;
    }

    // Если это JSON, проверяем его валидность перед записью
    if (fileName.endsWith('.json')) {
      try {
        JSON.parse(text);
      } catch (e) {
        Alert.alert('Ошибка JSON', 'Текст содержит синтаксические ошибки и не является валидным JSON');
        return;
      }
    }

    try {
      // Отправляем измененный текст обратно по системной ссылке (Uri)
      await fetch(fileUri, {
        method: 'PUT',
        body: text,
      });
      Alert.alert('Успех', 'Файл успешно сохранен');
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    }
  };

  // Переключение между найденными строками поиска
  const navigateSearch = (direction) => {
    if (searchMatches.length === 0) return;

    let nextIndex = currentMatchIndex + direction;
    if (nextIndex >= searchMatches.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = searchMatches.length - 1;

    setCurrentMatchIndex(nextIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Верхняя панель управления */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.button} onPress={openFile}>
            <Text style={styles.buttonText}>Открыть</Text>
          </TouchableOpacity>
          
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>

          <TouchableOpacity style={styles.button} onPress={saveFile}>
            <Text style={styles.buttonText}>Сохранить</Text>
          </TouchableOpacity>
        </View>

        {/* Панель поиска */}
        {showSearch && (
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск слова..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchMatches.length > 0 && (
              <Text style={styles.searchCount}>
                {currentMatchIndex + 1}/{searchMatches.length} (Стр. {searchMatches[currentMatchIndex] + 1})
              </Text>
            )}
            <View style={styles.searchNav}>
              <TouchableOpacity style={styles.navButton} onPress={() => navigateSearch(-1)}>
                <Text style={styles.navButtonText}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={() => navigateSearch(1)}>
                <Text style={styles.navButtonText}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Кнопка вызова/скрытия поиска */}
        <TouchableOpacity 
          style={styles.toggleSearch} 
          onPress={() => setShowSearch(!showSearch)}
        >
          <Text style={styles.toggleSearchText}>
            {showSearch ? 'Скрыть поиск' : 'Поиск по строкам'}
          </Text>
        </TouchableOpacity>

        {/* Главная рабочая область текста */}
        <ScrollView style={styles.editorScroll} contentContainerStyle={{ flexGrow: 1 }}>
          <TextInput
            ref={inputRef}
            style={styles.editorInput}
            multiline
            textAlignVertical="top"
            value={text}
            onChangeText={setText}
            placeholder="Текст файла отобразится здесь..."
            placeholderTextColor="#aaa"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  fileName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: '#007acc',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleSearch: {
    backgroundColor: '#333',
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  toggleSearchText: {
    color: '#aaa',
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252526',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#3c3c3c',
    color: '#fff',
    paddingHorizontal: 10,
    borderRadius: 4,
    fontSize: 14,
  },
  searchCount: {
    color: '#aaa',
    fontSize: 12,
    marginHorizontal: 8,
  },
  searchNav: {
    flexDirection: 'row',
  },
  navButton: {
    backgroundColor: '#444',
    padding: 8,
    marginLeft: 4,
    borderRadius: 4,
    width: 32,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  editorScroll: {
    flex: 1,
  },
  editorInput: {
    flex: 1,
    color: '#d4d4d4',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    padding: 15,
    lineHeight: 22,
  },
});

export default App;
