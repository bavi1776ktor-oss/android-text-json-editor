import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const translations = {
  ru: {
    title: "Редактор JSON и TXT",
    btnOpen: "Открыть файл",
    btnNewJson: "+ Новый JSON",
    btnNewTxt: "+ Новый TXT",
    btnSave: "Сохранить",
    btnShare: "Поделиться",
    placeholder: "Текст файла отобразится здесь...",
    statusEmpty: "Файл не выбран",
    statusEditing: "Редактирование: ",
    alertSuccess: "Успешно",
    alertSaved: "Файл успешно сохранен!",
    alertError: "Ошибка",
    alertReadError: "Не удалось прочитать файл",
    alertSaveError: "Не удалось сохранить файл",
    alertInvalidJson: "Внимание: Неверный формат JSON!",
    alertShareError: "Невозможно поделиться файлом",
    langBtn: "Укр"
  },
  uk: {
    title: "Редактор JSON та TXT",
    btnOpen: "Відкрити файл",
    btnNewJson: "+ Новий JSON",
    btnNewTxt: "+ Новий TXT",
    btnSave: "Зберегти",
    btnShare: "Поділитись",
    placeholder: "Текст файлу відобразиться тут...",
    statusEmpty: "Файл не обрано",
    statusEditing: "Редагування: ",
    alertSuccess: "Успішно",
    alertSaved: "Файл успішно збережено!",
    alertError: "Помилка",
    alertReadError: "Не вдалося прочитати файл",
    alertSaveError: "Не вдалося зберегти файл",
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
  const [fileType, setFileType] = useState(null); // 'json' или 'txt'
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  const toggleLang = () => {
    setLang(lang === 'ru' ? 'uk' : 'ru');
  };

  // Открытие файла через системный проводник
  const handleOpenFile = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/json', '*/*'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        const content = await FileSystem.readAsStringAsync(file.uri);
        
        setFileUri(file.uri);
        setFileName(file.name);
        setFileContent(content);
        setFileType(file.name.toLowerCase().endsWith('.json') ? 'json' : 'txt');
      }
    } catch (error) {
      Alert.alert(t.alertError, t.alertReadError);
    } finally {
      setLoading(false);
    }
  };

  // Создание нового пустого файла JSON
  const handleCreateNewJson = () => {
    setFileContent('{\n  "key": "value"\n}');
    setFileName('new_file.json');
    setFileType('json');
    setFileUri(null);
  };

  // Создание нового пустого файла TXT
  const handleCreateNewTxt = () => {
    setFileContent('');
    setFileName('new_file.txt');
    setFileType('txt');
    setFileUri(null);
  };

  // Сохранение изменений
  const handleSaveFile = async () => {
    // Если это JSON, базовая проверка синтаксиса перед сохранением
    if (fileType === 'json') {
      try {
        JSON.parse(fileContent);
      } catch (e) {
        Alert.alert(t.alertError, t.alertInvalidJson);
        return;
      }
    }

    setLoading(true);
    try {
      let targetUri = fileUri;
      
      // Если файл новый (еще не привязан к системе), создаем его в кэше Expo для возможности экспорта
      if (!targetUri) {
        targetUri = FileSystem.cacheDirectory + fileName;
      }

      await FileSystem.writeAsStringAsync(targetUri, fileContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      setFileUri(targetUri);
      Alert.alert(t.alertSuccess, t.alertSaved);
    } catch (error) {
      Alert.alert(t.alertError, t.alertSaveError);
    } finally {
      setLoading(false);
    }
  };

  // Поделиться файлом (Share)
  const handleShareFile = async () => {
    try {
      let targetUri = fileUri;
      
      // Если файл редактировался, но физически не сохранен на диске, принудительно пишем его в кэш
      if (!targetUri || !fileUri) {
        targetUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(targetUri, fileContent);
        setFileUri(targetUri);
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri);
      } else {
        Alert.alert(t.alertError, t.alertShareError);
      }
    } catch (error) {
      Alert.alert(t.alertError, t.alertShareError);
    }
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

      {/* Кнопки управления файлами */}
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

      {/* Статус-бар текущего файла */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText} numberOfLines={1}>
          {fileName ? `${t.statusEditing}${fileName}` : t.statusEmpty}
        </Text>
      </View>

      {/* Поле редактора */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0052CC" />
        </View>
      ) : (
        <ScrollView style={styles.editorScroll} contentContainerStyle={{ flexGrow: 1 }}>
          <TextInput
            style={styles.editorInput}
            multiline
            textAlignVertical="top"
            placeholder={t.placeholder}
            value={fileContent}
            onChangeText={setFileContent}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </ScrollView>
      )}

      {/* Нижние кнопки действий */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.btnBottom, styles.btnSaveColor, !fileName && styles.btnDisabled]} 
          onPress={handleSaveFile}
          disabled={!fileName}
        >
          <Text style={styles.btnText}>{t.btnSave}</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F26'
  },
  langButton: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  langButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14
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
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center'
  },
  btnNew: {
    backgroundColor: '#28A745'
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13
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
  editorScroll: {
    flex: 1,
    backgroundColor: '#FFF',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderBottomColor: '#E1E6EB'
  },
  editorInput: {
    flex: 1,
    padding: 15,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1A1F26'
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
    paddingVertical: 14,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: 'center'
  },
  btnSaveColor: {
    backgroundColor: '#28A745'
  },
  btnShareColor: {
    backgroundColor: '#17A2B8'
  },
  btnDisabled: {
    backgroundColor: '#A0AEC0',
    opacity: 0.6
  }
});
