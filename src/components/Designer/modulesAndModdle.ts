import { type Ref, toRaw } from 'vue'
import type { ModuleDeclaration } from 'didi'
import type { EditorSettings } from 'types/editor/settings'

// ** 官方流程模拟 module
import TokenSimulationModule from 'bpmn-js-token-simulation'

// moddle 定义文件
import activitiModdleDescriptors from '@/moddle-extensions/activiti.json'
import camundaModdleDescriptors from '@/moddle-extensions/camunda.json'
import flowableModdleDescriptors from '@/moddle-extensions/flowable.json'
import MiyueModdleDescriptors from '@/moddle-extensions/miyue.json'

// camunda 官方侧边栏扩展
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  CamundaPlatformPropertiesProviderModule
} from 'bpmn-js-properties-panel'

import CamundaExtensionModule from 'camunda-bpmn-moddle/resources/camunda.json'

// 官方扩展工具 元素模板选择
// import ElementTemplateChooserModule from '@bpmn-io/element-template-chooser'
// import ConnectorsExtensionModule from 'bpmn-js-connectors-extension'

// import Grid from 'diagram-js/lib/features/grid-snapping/visuals'

// 自定义 modules 扩展模块
import translate from '@/additional-modules/Translate'
import Rules from '@/additional-modules/Rules'
import AutoPlace from '@/additional-modules/AutoPlace'
import ElementFactory from '@/additional-modules/ElementFactory'
import EnhancementPalette from '@/additional-modules/Palette/EnhancementPalette'
import RewritePalette from '@/additional-modules/Palette/RewritePalette'
import EnhancementContextPad from '@/additional-modules/ContextPad/EnhancementContextPad'
import RewriteContextPad from '@/additional-modules/ContextPad/RewriteContextPad'
import EnhancementRenderer from '@/additional-modules/Renderer/EnhancementRenderer'
import RewriteRenderer from '@/additional-modules/Renderer/RewriteRenderer'

// 流程图校验部分
import lintModule from 'bpmn-js-bpmnlint'
import bpmnlint from '@/additional-modules/Lint/bpmnlint'

// 小地图
import minimapModule from 'diagram-js-minimap'

import BpmnColorPickerModule from 'bpmn-js-color-picker'

import GridLineModule from 'diagram-js-grid-bg'

// 外置 label
import ExternalLabelModule from 'bpmn-js-external-label-modeling'

export type ModulesAndModdles = [
  ModuleDeclaration[],
  { [key: string]: any },
  { [key: string]: unknown }
]

export default function (settings: Ref<EditorSettings>): ModulesAndModdles {
  const modules: ModuleDeclaration[] = [] // modules 扩展模块数组
  let moddle: { [key: string]: any } = {} // moddle 声明文件对象
  const options: { [key: string]: unknown } = {} // modeler 其他配置

  // 配置 palette (可覆盖 paletteProvider 取消原生侧边栏)
  settings.value.paletteMode === 'enhancement' && modules.push(EnhancementPalette)
  settings.value.paletteMode === 'rewrite' && modules.push(RewritePalette)
  settings.value.paletteMode === 'custom' &&
    modules.push({ paletteProvider: ['type', function () {}] })

  // 配置 contextPad (可覆盖 contextPadProvider 取消原生上下文菜单)
  settings.value.contextPadMode === 'enhancement' && modules.push(EnhancementContextPad)
  settings.value.contextPadMode === 'rewrite' && modules.push(RewriteContextPad)

  // 配置 自定义渲染
  settings.value.rendererMode === 'enhancement' && modules.push(EnhancementRenderer)
  if (settings.value.rendererMode === 'rewrite') {
    modules.push(RewriteRenderer)
    options['bpmnRenderer'] = { ...toRaw(settings.value).customTheme }
  }

  // 配置模板选择弹窗（会影响默认 popupmenu）
  if (settings.value.templateChooser || settings.value.penalMode !== 'custom') {
    modules.push(
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        CamundaPlatformPropertiesProviderModule
    )

    if (settings.value.penalMode !== 'custom') {
      options['propertiesPanel'] = { parent: '#camunda-penal' }

      // 如果使用Camunda面板，确保Camunda扩展被注册
      if (settings.value.processEngine === 'camunda') {
        moddle['camunda'] = camundaModdleDescriptors
      }
    }
  }

  // 设置 lint 校验
  if (settings.value.useLint) {
    modules.push(lintModule)
    options['linting'] = {
      active: true,
      bpmnlint: bpmnlint
    }
  }

  // 设置小地图
  if (settings.value.miniMap) {
    modules.push(minimapModule)
    options['minimap'] = {
      open: true
    }
  }

  // 设置其他模块的启用
  if (settings.value.otherModule) {
    // 设置 自定义规则
    modules.push(Rules)

    modules.push(AutoPlace)

    modules.push(TokenSimulationModule)

    modules.push(BpmnColorPickerModule)

    modules.push(GridLineModule)
    modules.push(ExternalLabelModule)

    // 设置键盘事件绑定
    options['keyboard'] = {
      bindTo: document
    }

    modules.push(ElementFactory)
    options['elementFactory'] = {
      'bpmn:Task': { width: 120, height: 120 },
      'bpmn:SequenceFlow': { width: 100, height: 80 }
    }
  }

  // 配置 翻译
  modules.push(translate)

  // 设置对应的 moddle 解析配置文件
  if (settings.value.processEngine === 'activiti') {
    moddle['activiti'] = activitiModdleDescriptors
  } else if (settings.value.processEngine === 'camunda') {
    moddle['camunda'] = camundaModdleDescriptors
  } else if (settings.value.processEngine === 'flowable') {
    moddle['flowable'] = flowableModdleDescriptors
  }

  // 设置自定义属性（始终注册）
  // moddle['miyue'] = MiyueModdleDescriptors

  return [modules, moddle, options]
}
