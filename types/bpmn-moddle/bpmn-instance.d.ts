declare interface BpmnScript {
  scriptFormat?: string
  resource?: string
  value?: string
}

declare interface BpmnField {
  name: string
  expression?: string
  stringValue?: string
  string?: string
  htmlVar?: string
  type: string; // 新增字段类型
}

declare interface BpmnExtensionElements {
  values: any[]
}

declare interface BpmnExecutionListener {
  event: string
  expression?: string
  class?: string
  delegateExpression?: string
  script?: BpmnScript
  fields?: BpmnField[]; // 修改为字段数组
}

declare interface BpmnExtensionProperty {
  id?: string
  name?: string
  value?: string
}

declare interface BpmnExtensionProperties {
  values: BpmnExtensionProperty[]
}
