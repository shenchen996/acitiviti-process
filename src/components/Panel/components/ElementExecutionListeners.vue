<template>
  <n-collapse-item name="element-execution-listeners">
    <template #header>
      <collapse-title :title="$t('panel.executionListeners')">
        <lucide-icon name="Radio" />
      </collapse-title>
    </template>
    <template #header-extra>
      <n-tag type="primary" round>
        {{ listeners.length }}
      </n-tag>
    </template>
    <div class="element-extension-listeners">
      <n-data-table size="small" max-height="20vh" :columns="columns" :data="listeners" />

      <n-button type="info" class="inline-large-button" secondary @click="openListenerModel(-1)">
        <lucide-icon :size="20" name="Plus" />
        <span>{{ $t('panel.addExecutionListener') }}</span>
      </n-button>
    </div>

    <n-modal
      v-model:show="modelVisible"
      preset="dialog"
      :title="$t('panel.addExecutionListener')"
      :style="{ width: '640px' }"
    >
      <n-form
        ref="formRef"
        :model="newListener"
        :rules="formRules"
        class="need-filled"
        aria-modal="true"
      >
        <n-form-item path="event" :label="$t('panel.executionListenerEventType')">
          <n-select v-model:value="newListener.event" :options="listenerEventTypeOptions" />
        </n-form-item>
        <n-form-item path="type" :label="$t('panel.executionListenerType')">
          <n-select
            v-model:value="newListener.type"
            :options="listenerTypeOptions"
            @update:value="updateListenerType"
          />
        </n-form-item>
        <n-form-item
          v-if="formItemVisible.listenerType === 'class'"
          path="class"
          :label="$t('panel.javaClass')"
        >
          <n-input v-model:value="newListener.class" @keydown.enter.prevent />
        </n-form-item>
        <n-form-item
          v-if="formItemVisible.listenerType === 'expression'"
          path="expression"
          :label="$t('panel.expression')"
        >
          <n-input v-model:value="newListener.expression" @keydown.enter.prevent />
        </n-form-item>
        <n-form-item
          v-if="formItemVisible.listenerType === 'delegateExpression'"
          path="delegateExpression"
          :label="$t('panel.delegateExpression')"
        >
          <n-input v-model:value="newListener.delegateExpression" @keydown.enter.prevent />
        </n-form-item>
        <n-form-item path="fields" :label="$t('panel.fields')">
          <n-data-table
              size="small"
              :columns="fieldColumns"
              :data="newListener.fields"
              @row-remove="removeField"
          >
            <template #action="{ rowIndex }">
              <n-button
                  quaternary
                  size="small"
                  type="error"
                  @click="removeField(rowIndex)"
              >
                {{ $t('panel.remove') }}
              </n-button>
            </template>
          </n-data-table>
          <n-button type="info" class="inline-large-button" secondary @click="showAddFieldModal">
            <lucide-icon :size="20" name="Plus" />
            <span>{{ $t('panel.addField') }}</span>
          </n-button>
        </n-form-item>
        <template v-if="formItemVisible.listenerType === 'script' && newListener.script">
          <n-form-item
            key="scriptFormat"
            path="script.scriptFormat"
            :label="$t('panel.scriptFormat')"
          >
            <n-input v-model:value="newListener.script.scriptFormat" @keydown.enter.prevent />
          </n-form-item>
          <n-form-item key="scriptType" path="script.scriptType" :label="$t('panel.scriptType')">
            <n-select
              v-model:value="newListener.script.scriptType"
              :options="scriptTypeOptions"
              @update:value="updateScriptType"
            />
          </n-form-item>
          <n-form-item
            v-if="formItemVisible.scriptType === 'inline'"
            key="scriptContent"
            path="script.value"
            :label="$t('panel.scriptBody')"
          >
            <n-input
              v-model:value="newListener.script.value"
              type="textarea"
              @keydown.enter.prevent
            />
          </n-form-item>
          <n-form-item
            v-if="formItemVisible.scriptType === 'external'"
            key="scriptResource"
            path="script.resource"
            :label="$t('panel.scriptResource')"
          >
            <n-input v-model:value="newListener.script.resource" @keydown.enter.prevent />
          </n-form-item>
        </template>
      </n-form>
      <template #action>
        <n-button size="small" type="info" @click="saveExecutionListener">{{
          $t('panel.confirm')
        }}</n-button>
      </template>
    </n-modal>
    <!-- 新增：字段添加模态框 -->
    <n-modal
        v-model:show="addFieldModalVisible"
        preset="dialog"
        :title="$t('panel.addField')"
        :style="{ width: '480px' }"
    >
      <n-form
          ref="fieldFormRef"
          :model="newField"
          :rules="fieldFormRules"
          class="need-filled"
          aria-modal="true"
      >
        <n-form-item path="name" :label="$t('panel.fieldName')">
          <n-input v-model:value="newField.name" placeholder="请输入字段名" />
        </n-form-item>
        <n-form-item path="type" :label="$t('panel.fieldType')">
          <n-select v-model:value="newField.type" :options="fieldTypeOptions" placeholder="请选择字段类型" />
        </n-form-item>
        <n-form-item path="value" :label="$t('panel.fieldValue')">
          <n-input v-model:value="newField.value" placeholder="请输入字段值" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button size="small" @click="addFieldModalVisible = false">
          {{ $t('panel.cancel') }}
        </n-button>
        <n-button size="small" type="info" @click="handleAddField">
          {{ $t('panel.confirm') }}
        </n-button>
      </template>
    </n-modal>
  </n-collapse-item>
</template>

<script lang="ts">
  import { defineComponent, h, markRaw, ref, computed, nextTick, onMounted, ComputedRef } from 'vue'
  import { FormInst, FormRules, DataTableColumns, NButton } from 'naive-ui';
  import modeler from '@/store/modeler'
  import { ModdleElement } from 'bpmn-moddle'
  import { Element } from 'diagram-js/lib/model/Types'
  import {
    addExecutionListener,
    getDefaultEvent,
    getExecutionListeners,
    getExecutionListenerType,
    getExecutionListenerTypes,
    removeExecutionListener,
    updateExecutionListener
  } from '@/bo-utils/executionListenersUtil'
  import { getScriptType } from '@/bo-utils/scriptUtil'
  import EventEmitter from '@/utils/EventEmitter'
  import { useI18n } from 'vue-i18n'

  export default defineComponent({
    name: 'ElementExecutionListeners',
    setup() {
      const { t } = useI18n()
      const modelerStore = modeler()
      const getActive = computed(() => modelerStore.getActive!)
      const getActiveId = computed<string>(() => modelerStore.getActiveId!)
      let listenersRaw = markRaw([])
      let activeIndex = -1

      const modelVisible = ref(false)
      const listeners = ref<ExecutionListenerForm[]>([])
      const newListener = ref<ExecutionListenerForm>({
        event: '',
        type: 'class',
        fields: [] // 初始化字段数组
         })
      const formRef = ref<FormInst | null>(null)
      const formItemVisible = ref<FormItemVisible>({
        listenerType: 'class',
        scriptType: 'none'
      })


      // 新增：字段添加相关状态
      const addFieldModalVisible = ref(false);
      const newField = ref<{ name: string; type: string; value: string }>({
        name: '',
        type: 'string', // 默认类型
        value: ''
      });
      const fieldFormRef = ref<FormInst | null>(null);
      const fieldFormRules: FormRules = {
        name: { required: true, message: '字段名不能为空' },
        type: { required: true, message: '字段类型不能为空' },
        value: { required: true, message: '字段值不能为空' }
      };
      const fieldTypeOptions = ref([
        { label: 'string', value: 'string' },
        { label: 'expression', value: 'expression' },
        { label: 'implementation', value: 'implementation' },
        { label: 'stringValue', value: 'stringValue' },
      ]);
      const listenerEventTypeOptions = ref<Record<string, string>[]>([
        { label: 'Start', value: 'start' },
        { label: 'End', value: 'end' },
        { label: 'Take', value: 'take' }
      ])
      const listenerTypeOptions = ref<Record<string, string>[]>([
        { label: 'Java Class', value: 'class' },
        { label: 'Expression', value: 'expression' },
        { label: 'DelegateExpression', value: 'delegateExpression' },
        { label: 'Script', value: 'script' }
      ])
      const scriptTypeOptions = ref<Record<string, string>[]>([
        { label: 'External Resource', value: 'external' },
        { label: 'Inline Script', value: 'inline' },
        { label: 'None', value: 'none' }
      ])
      const formRules: FormRules = {
        event: { required: true, trigger: ['blur', 'change'], message: '事件类型不能为空' },
        type: { required: true, trigger: ['blur', 'change'], message: '监听器类型不能为空' }
      }
      const columns: ComputedRef<DataTableColumns<ExecutionListenerForm>> = computed(() => [
        { title: t('panel.index'), key: 'index', render: (a, index) => index + 1, width: 60 },
        { title: 'EventType', key: 'event', ellipsis: { tooltip: true } },
        { title: 'ListenerType', key: 'type', ellipsis: { tooltip: true } },
        {
          title: t('panel.operations'),
          key: 'operation',
          width: 140,
          align: 'center',
          render: (row, index) =>
            h('span', {}, [
              h(
                NButton,
                {
                  quaternary: true,
                  size: 'small',
                  type: 'info',
                  onClick: () => openListenerModel(index, row)
                },
                { default: () => t('panel.edit') }
              ),
              h(
                NButton,
                {
                  quaternary: true,
                  size: 'small',
                  type: 'error',
                  onClick: () => removeListener(index)
                },
                { default: () => t('panel.remove') }
              )
            ])
        }
      ])

      const fieldColumns: DataTableColumns<BpmnField> = [
        { title: t('panel.fieldName'), key: 'name' },
        { title: t('panel.fieldType'), key: 'type' },
        { title: t('panel.fieldValue'), key: 'value' },
        {
          title: t('panel.operations'),
          key: 'action',
          scopedSlots: { customRender: 'action' }
        }
      ];

      const updateListenerType = (value: string) => {
        formItemVisible.value.listenerType = value
        newListener.value = {
          ...newListener.value,
          type: value,
          ...(value === 'script' ? { script: newListener.value.script || {} } : {})
        }
      }
      const updateScriptType = (value: string) => {
        formItemVisible.value.scriptType = value
        newListener.value.script = {
          scriptFormat: newListener.value.script?.scriptFormat,
          scriptType: value
        }
      }

      const showAddFieldModal = () => {
        // 重置字段表单
        newField.value = {
          name: '',
          type: 'String',
          value: ''
        };
        addFieldModalVisible.value = true;
        nextTick(() => {
          fieldFormRef.value?.restoreValidation();
        });
      };

      // 修改：添加字段方法
      const handleAddField = async () => {
        await fieldFormRef.value?.validate();

        // 根据类型创建正确的字段结构
        const fieldData: any = {
          name: newField.value.name,
          type: newField.value.type
        };

        // 根据不同类型设置不同的值属性
        switch (newField.value.type) {
          case 'string':
            fieldData.string = newField.value.value;
            break;
          case 'expression':
            fieldData.expression = newField.value.value;
            break;
          case 'integer':
            fieldData.integer = newField.value.value;
            break;
          case 'long':
            fieldData.long = newField.value.value;
            break;
          case 'double':
            fieldData.double = newField.value.value;
            break;
          case 'boolean':
            fieldData.boolean = newField.value.value;
            break;
          default:
            fieldData.string = newField.value.value;
        }
        fieldData.string=newField.value.value;
        // 添加到字段列表
        if (!newListener.value.fields) {
          newListener.value.fields = [];
        }
        newListener.value.fields.push(fieldData);

        // 关闭模态框
        addFieldModalVisible.value = false;
      };

      const removeField = (index: number) => {
        if (newListener.value.fields) {
          newListener.value.fields.splice(index, 1);
        }
      };

      const reloadExtensionListeners = () => {
        modelVisible.value = false
        updateListenerType('class')
        newListener.value = { event: getDefaultEvent(getActive.value), type: 'class' }
        listenerEventTypeOptions.value = getExecutionListenerTypes(getActive.value)
        ;(listenersRaw as ModdleElement[]) = markRaw(getExecutionListeners(getActive.value as Element))
        const list = listenersRaw.map(
          (item: ModdleElement & BpmnExecutionListener): ExecutionListenerForm => ({
            ...item,
            ...(item.script
              ? {
                  script: {
                    ...item.script,
                    scriptType: getScriptType(item.script as ModdleElement & BpmnScript)
                  }
                }
              : {}),
            type: getExecutionListenerType(item),
            fields: item.fields || [] // 加载字段
               })
        )
        listeners.value = JSON.parse(JSON.stringify(list))
      }

      const removeListener = (index: number) => {
        const listener: ModdleElement = listenersRaw[index]
        removeExecutionListener(getActive.value, listener)
        reloadExtensionListeners()
      }

      const saveExecutionListener = async () => {
        await formRef.value!.validate()
        activeIndex === -1
          ? addExecutionListener(getActive.value, newListener.value)
          : updateExecutionListener(getActive.value, newListener.value, listenersRaw[activeIndex])
        reloadExtensionListeners()
      }

      const openListenerModel = async (index: number, listenerData?: ExecutionListenerForm) => {
        activeIndex = index
        console.log(JSON.stringify(listenerData))
        listenerData && (newListener.value = JSON.parse(JSON.stringify(listenerData)))
        updateListenerType(listenerData?.type || 'class')
        modelVisible.value = true
        await nextTick()
        formRef.value && formRef.value.restoreValidation()
      }

      onMounted(() => {
        reloadExtensionListeners()
        EventEmitter.on('element-update', reloadExtensionListeners)
      })

      return {
        modelVisible,
        getActiveId,
        getActive,
        formRef,
        listeners,
        newListener,
        formRules,
        columns,
        formItemVisible,
        listenerEventTypeOptions,
        listenerTypeOptions,
        scriptTypeOptions,
        removeListener,
        saveExecutionListener,
        openListenerModel,
        updateListenerType,
        updateScriptType,
        removeField,
        fieldColumns,
        addFieldModalVisible,
        newField,
        fieldFormRef,
        fieldFormRules,
        fieldTypeOptions,
        showAddFieldModal,
        handleAddField
      }
    }
  })
</script>
