import { createApp } from 'vue';
import {
  ActionSheet,
  Button,
  Calendar,
  Cell,
  CellGroup,
  DatePicker,
  Empty,
  Field,
  Icon,
  Loading,
  Popup,
  Tag,
} from 'vant';
import 'vant/lib/index.css';
import App from './App.vue';
import './styles.css';

createApp(App)
  .use(Button)
  .use(Cell)
  .use(CellGroup)
  .use(Tag)
  .use(Icon)
  .use(ActionSheet)
  .use(Calendar)
  .use(Popup)
  .use(Field)
  .use(DatePicker)
  .use(Empty)
  .use(Loading)
  .mount('#app');
