import { markRaw, Ref } from 'vue'
import Modeler from 'bpmn-js/lib/Modeler'
import EventEmitter from '@/utils/EventEmitter'
import modelerStore from '@/store/modeler'
import EnhancementContextmenu from '@/additional-functions/EnhancementContextmenu'

import type { BaseViewerOptions } from 'bpmn-js/lib/BaseViewer'
import type { ModulesAndModdles } from '@/components/Designer/modulesAndModdle'
import activitiModdleDescriptors from '@/moddle-extensions/activiti.json'

/**
 * 初始化 Modeler 的异步函数
 * @param designer - 一个 Vue 的 Ref 对象，指向包含 BPMN 图形的 HTMLElement
 * @param modelerModules - 包含额外模块和 moddle 扩展的对象
 * @param emit - Vue 的 emit 函数，用于触发事件
 */
export default async function (
  designer: Ref<HTMLElement | null>,
  modelerModules: ModulesAndModdles,
  emit
) {
  const store = modelerStore()

  // 配置 Modeler 的选项
  const options: BaseViewerOptions = {
    container: designer!.value as HTMLElement,
    additionalModules: modelerModules[0] || [],//添加属性面板，添加翻译模块
    moddleExtensions: modelerModules[1] || {},//模块拓展，拓展activiti的描述
    ...modelerModules[2]
  }

  // 如果 store 中已经存在一个 Modeler 实例
  if (store.getModeler) {
    // 清除旧的 Modeler 实例
    store.getModeler.destroy()
    // 将 store 中的 Modeler 实例设置为 undefined
    await store.setModeler(undefined)
  }

  // 创建新的 Modeler 实例
  const modeler: Modeler = new Modeler(options)

  // 将新的 Modeler 实例存储到 store 中，并使用 markRaw 标记以保持其非响应式
  await store.setModeler(markRaw(modeler))

  // 触发 'modeler-init' 事件，通知其他组件 Modeler 已经初始化
  EventEmitter.emit('modeler-init', modeler)

  // 增强 Modeler 的上下文菜单
  EnhancementContextmenu(modeler)

  // 监听 Modeler 的命令堆栈变化事件
  modeler.on('commandStack.changed', async (event) => {
    try {
      // 保存当前 Modeler 的 XML 内容，并格式化
      const { xml } = await modeler.saveXML({ format: true })

      // 触发 'update:xml' 事件，更新父组件的 XML 内容
      emit('update:xml', xml)
      // 触发 'command-stack-changed' 事件，通知其他组件命令堆栈已变化
      emit('command-stack-changed', event)
    } catch (error) {
      // 如果保存 XML 时发生错误，打印错误信息
      console.error(error)
    }
  })
}
