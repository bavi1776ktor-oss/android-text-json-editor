import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { height } = Dimensions.get('window');

const translations = {
  ru: {
    title: "Редактор JSON и TXT",
    btnOpen: "Открыть",
    btnNewJson: "+ JSON",
    btnNewTxt: "+ TXT",
    btnSave: "Сохранить",
    btnSaveAs: "Сохранить как...",
    btnShare: "Поделиться",
    placeholder: "Текст файла отобразится здесь...",
    searchPlaceholder: "Поиск текста...",
    statusEmpty: "Файл не выбран",
    statusEditing: "Файл: ",
    alertSuccess: "Успешно",
    alertSaved: "Файл успешно сохранен!",
    alertError: "Ошибка",
    alertReadError: "Не удалось прочитать файл",
    alertSaveError: "Не удалось сохранить файл. Попробуйте 'Сохранить как...'",
    alertInvalidJson: "Внимание: Неверный формат JSON!",
    alertShareError: "Невозможно поделиться файлом",
    langBtn: "Укр"
  },
  uk: {
    title: "Редактор JSON та TXT",
    btnOpen: "Відкрити",
    btnNewJson: "+ JSON",
    btnNewTxt: "+ TXT",
    btnSave: "Зберегти",
    btnSaveAs: "Зберегти як...",
    btnShare: "Поділитись",
    placeholder: "Текст файлу відобразиться тут...",
    searchPlaceholder: "Пошук тексту...",
    statusEmpty: "Файл не обрано",
    statusEditing: "Файл: ",
    alertSuccess: "Успішно",
    alertSaved: "Файл успішно збережено!",
    alertError: "Помилка",
    alertReadError: "Не вдалося прочитати файл",
    alertSaveError: "Не вдалося зберегти файл. Спробуйте 'Зберегти як...'",
    alertInvalidJson: "Увага: Невірний формат JSON!",
    alertShareError: "Неможливо поділитися файлом",
    langBtn: "Рус"
  }
};

export default function App() {
  const [lang, setLang] = useState('ru');
  const [fileContent, setFileContent] = useState('');
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Поиск и подсветка
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  
  const t = translations[lang];
  const scrollViewRef = useRef(null);

  const toggleLang = () => {
    setLang(lang === 'ru' ? 'uk' : 'ru');
  };

  // Поиск всех вхождений строки (без учета регистра)
  useEffect(() => {
    if (!searchQuery || !fileContent) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const content = fileContent.toLowerCase();
    const positions = [];
    let pos = content.indexOf(query);

    while (pos !== -1) {
      positions.push(pos);
      pos = content.indexOf(query, pos + 1);
    }

    setSearchResults(positions);
    if (positions.length > 0) {
      setCurrentResultIndex(0);
    } else {
      setCurrentResultIndex(-1);
    }
  }, [searchQuery, fileContent]);

  // Прыжок к найденному совпадению
  useEffect(() => {
    if (currentResultIndex !== -1 && searchResults[currentResultIndex] !== undefined) {
      const charIndex = searchResults[currentResultIndex];
      const totalChars = fileContent.length || 1;
      
      const estimatedContentHeight = Math.max(height, totalChars * 0.35); 
      const scrollY = (charIndex / totalChars) * estimatedContentHeight;

      scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollY - 120), animated: true });
    }
  }, [currentResultIndex, searchResults]);

  const handleNextSearch = () => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex((prev) => (prev + 1) % searchResults.length);
  };

  const handlePrevSearch = () => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  };

  // Функция рендеринга подсвеченного текста
  const renderHighlightedText = () => {
    if (!searchQuery || searchResults.length === 0) {
      return <Text style={styles.highlightDummyText}>{fileContent}</Text>;
    }

    const parts = fileContent.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));
    let globalCharOffset = 0;

    return (
      <Text style={styles.highlightDummyText}>
        {parts.map((part, index) => {
          const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
          const currentOffset = globalCharOffset;
          globalCharOffset += part.length;

          if (isMatch) {
            // Проверяем, является ли это совпадение текущим выбранным
            const isCurrent = searchResults[currentResultIndex] === currentOffset;
            return (
              <Text 
                key={index} 
                style={isCurrent ? styles.currentMatch : styles.normalMatch}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Файловые операции
  const handleOpenFile = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/json', '*/*'],
        copyToCacheDirectory: false
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        const content = await FileSystem.readAsStringAsync(file.uri);
        
        setFileUri(file.uri);
        setFileName(file.name);
        setFileContent(content);
        setFileType(file.name.toLowerCase().endsWith('.json') ? 'json' : 'txt');
        setSearchQuery('');
      }
    } catch (error) {
      Alert.alert(t.alertError, t.alertReadError);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewJson = () => {
    setFileContent('{\n  "key": "value"\n}');
    setFileName('new_file.json');
    setFileType('json');
    setFileUri(null);
    setSearchQuery('');
  };

  const handleCreateNewTxt = () => {
    setFileContent('');
    setFileName('new_file.txt');
    setFileType('txt');
    setFileUri(null);
    setSearchQuery('');
  };

  const validateJson = () => {
    if (fileType === 'json') {
      try {
        JSON.parse(fileContent);
        return true;
      } catch (e) {
        Alert.alert(t.alertError, t.alertInvalidJson);
        return false;
      }
    }
    return true;
  };

  const handleSaveFile = async () => {
    if (!validateJson()) return;
    setLoading(true);
    try {
      if (fileUri) {
        await FileSystem.writeAsStringAsync(fileUri, fileContent, {
          encoding: FileSystem.EncodingType.UTF8
        });
        Alert.alert(t.alertSuccess, t.alertSaved);
      } else {
        handleSaveAsFile();
      }
    } catch (error) {
      Alert.alert(t.alertError, t.alertSaveError);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsFile = async () => {
    if (!validateJson()) return;
    setLoading(true);
    try {
      const tempUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(tempUri, fileContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempUri, { dialogTitle: t.btnSaveAs });
      } else {
        Alert.alert(t.alertError, t.alertShareError);
      }
    } catch (error) {
      Alert.alert(t.alertError, t.alertSaveError);
    } finally {
      setLoading(false);
    }
  };

  const handleShareFile = async () => {
    try {
      const tempUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(tempUri, fileContent);
      await Sharing.shareAsync(tempUri);
    } catch (error) {
      Alert.alert(t.alertError, t.alertShareError);
    }
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Шапка */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity style={styles.langButton} onPress={toggleLang}>
          <Text style={styles.langButtonText}>{t.langBtn}</Text>
        </TouchableOpacity>
      </View>

      {/* Верхние кнопки создания/открытия */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.btnAction} onPress={handleOpenFile}>
          <Text style={styles.btnText}>{t.btnOpen}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAction, styles.btnNew]} onPress={handleCreateNewJson}>
          <Text style={styles.btnText}>{t.btnNewJson}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAction, styles.btnNew]} onPress={handleCreateNewTxt}>
          <Text style={styles.btnText}>{t.btnNewTxt}</Text>
        </TouchableOpacity>
      </View>

      {/* Панель поиска со стрелками перехода */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchResults.length > 0 && (
          <View style={styles.searchControls}>
            <Text style={styles.searchCounter}>
              {currentResultIndex + 1}/{searchResults.length}
            </Text>
            <TouchableOpacity style={styles.btnSearchArrow} onPress={handlePrevSearch}>
              <Text style={styles.arrowText}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSearchArrow} onPress={handleNextSearch}>
              <Text style={styles.arrowText}>▶</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Статус-бар */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText} numberOfLines={1}>
          {fileName ? `${t.statusEditing}${fileName}` : t.statusEmpty}
        </Text>
      </View>

      {/* Редактор */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0052CC" />
        </View>
      ) : (
        <View style={styles.editorWrapper}>
          <ScrollView 
            ref={scrollViewRef} 
            style={styles.editorScroll} 
            contentContainerStyle={{ flexGrow: 1 }}
            removeClippedSubviews={true}
          >
            <View style={styles.textContainer}>
              {/* Слой с подсвеченным текстом */}
              {searchQuery.length > 0 && (
                <View style={styles.highlightLayer} pointerEvents="none">
                  {renderHighlightedText()}
                </View>
              )}
              
              {/* Настоящее текстовое поле ввода. Цвет текста становится прозрачным при активном поиске */}
              <TextInput
                style={[
                  styles.editorInput,
                  searchQuery.length > 0 && { color: 'rgba(26, 31, 38, 0.15)' }
                ]}
                multiline
                textAlignVertical="top"
                placeholder={t.placeholder}
                value={fileContent}
                onChangeText={setFileContent}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="off"
              />
            </View>
          </ScrollView>

          {/* Быстрые стрелки скролла Вверх / Вниз */}
          {fileName ? (
            <View style={styles.scrollNavigation}>
              <TouchableOpacity style={styles.navArrow} onPress={scrollToTop}>
                <Text style={styles.navArrowText}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navArrow} onPress={scrollToBottom}>
                <Text style={styles.navArrowText}>▼</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}

      {/* Нижняя панель действий */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.btnBottom, styles.btnSaveColor, !fileName && styles.btnDisabled]} 
          onPress={handleSaveFile}
          disabled={!fileName}
        >
          <Text style={styles.btnText}>{t.btnSave}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btnBottom, styles.btnSaveAsColor, !fileName && styles.btnDisabled]} 
          onPress={handleSaveAsFile}
          disabled={!fileName}
        >
          <Text style={styles.btnText}>{t.btnSaveAs}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btnBottom, styles.btnShareColor, !fileName && styles.btnDisabled]} 
          onPress={handleShareFile}
          disabled={!fileName}
        >
          <Text style={styles.btnText}>{t.btnShare}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E6EB'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F26'
  },
  langButton: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  langButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#FFF'
  },
  btnAction: {
    flex: 1,
    backgroundColor: '#0052CC',
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 6,
    alignItems: 'center'
  },
  btnNew: {
    backgroundColor: '#28A745'
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center'
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: '#FFF'
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E1E6EB'
  },
  searchControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8
  },
  searchCounter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    marginRight: 6
  },
  btnSearchArrow: {
    backgroundColor: '#E1E6EB',
    padding: 8,
    marginHorizontal: 2,
    borderRadius: 4
  },
  arrowText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1F26'
  },
  statusContainer: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    backgroundColor: '#E1E6EB'
  },
  statusText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500'
  },
  editorWrapper: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative'
  },
  editorScroll: {
    flex: 1,
    backgroundColor: '#FFF',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E6EB'
  },
  textContainer: {
    position: 'relative',
    flex: 1
  },
  editorInput: {
    flex: 1,
    padding: 15,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1A1F26',
    minHeight: 400
  },
  highlightLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 15,
    backgroundColor: 'transparent'
  },
  highlightDummyText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1A1F26'
  },
  normalMatch: {
    backgroundColor: '#FFEB3B', // Обычные совпадения подсвечиваются желтым
    color: '#000',
    fontWeight: 'bold'
  },
  currentMatch: {
    backgroundColor: '#FF9800', // Текущее выбранное совпадение — ярко-оранжевое
    color: '#FFF',
    fontWeight: 'bold'
  },
  scrollNavigation: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    justifyContent: 'space-between',
    height: 110,
    zIndex: 10
  },
  navArrow: {
    backgroundColor: 'rgba(0, 82, 204, 0.8)',
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  },
  navArrowText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E6EB'
  },
  btnBottom: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnSaveColor: {
    backgroundColor: '#28A745'
  },
  btnSaveAsColor: {
    backgroundColor: '#FD7E14'
  },
  btnShareColor: {
    backgroundColor: '#17A2B8'
  },
  btnDisabled: {
    backgroundColor: '#A0AEC0',
    opacity: 0.5
  }
});
