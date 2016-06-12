import * as ProtoBuf from 'protobufjs';

export function protoStringToTsDeclaration(proto: string, filename?: string): string {
  // const builder = ProtoBuf.loadProto(proto, null, filename);
  const json: ProtoBuf.MetaProto = (ProtoBuf.DotProto.Parser.parse as any)(proto);

  let ts = '';

  ts += json.messages.map(message => messageToTs(message, json)).join('\n');

  if (json.package) {
    ts = `export namespace ${json.package} {\n${indent(ts, 2)}}\n`;
  }

  return ts;
}

function messageToTs(message: ProtoBuf.ProtoMessage, parent) {
  let ts = `export interface ${message.name} {\n`;
  for (const field of message.fields) {
    ts += `  ${fieldToTs(field, message, parent)}\n`;
  }
  ts += `}\n`;

  if (
    (message.enums && message.enums.length) ||
    (message.messages && message.messages.length)
  ) {
    ts += `export namespace ${message.name} {\n`
    ts += indent(message.enums.map(eNum => enumToTs(eNum, message)).join('\n'), 2);
    ts += indent(message.messages.map(child => messageToTs(child, message)).join('\n'), 2);
    ts += `}\n`
  }

  return ts;
}

function fieldToTs(field: ProtoBuf.ProtoField, message: ProtoBuf.ProtoMessage, parent?) {
  let type = '';

  switch (field.type) {
    case 'int32':
      type = 'number';
      break;
    case 'string':
      type = 'string';
      break;
    default: {
      if (
        message && (
          (message.enums as any[])
            .filter(eNum => eNum.name === field.type)
            .length
          ||
          (message.messages as any[])
            .filter(message => message.name === field.type)
            .length
        )
      ) {
        type = `${message.name}.${field.type}`;
        break;
      } else if (
        parent && (
          (parent.enums as any[])
            .filter(eNum => eNum.name === field.type)
            .length
          ||
          (parent.messages as any[])
            .filter(message => message.name === field.type)
            .length
        )
      ) {
        type = `${field.type}`;
        break;
      } else {
        throw new Error(`Unknown field type: ${field.type}`);
      }
    }
  }

  let ts = `${field.name}`;

  switch (field.rule) {
    case 'optional':
      ts += `?: ${type}`;
      break;
    case 'required':
      ts += `: ${type}`;
      break;
    case 'repeated':
      ts += `: ${type}[]`;
      break;
    default:
      throw new Error(`Unknown field rule: ${field.rule}`);
  }

  ts += ';';

  return ts;
}

function enumToTs(eNum: ProtoBuf.ProtoEnum, message) {
  return `export enum ${eNum.name} {\n${
    eNum.values.map(value =>
      `  ${value.name} = ${value.id},`
    ).join('\n')
  }\n}\n`;
}

function indent(string: string, spaces: number) {
  let indentation = Array.apply(null, new Array(spaces)).map(x => ' ').join('');

  return string
    .split('\n')
    .map(line => line ? `${indentation}${line}` : '')
    .join('\n');
}
