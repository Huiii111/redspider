import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkov } from '../../server/adapters/checkov.js'
import { kics, resourceAddress } from '../../server/adapters/kics.js'
import { trivy } from '../../server/adapters/trivy.js'
import { UnreadableOutputError } from '../../server/core/errors.js'

const fixture = (name) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8')

describe('trivy adapter', () => {
  it('reads every failed check from real output', () => {
    expect(trivy.parseOutput(fixture('trivy-s3.json'))).toHaveLength(34)
  })

  it('names the rule and resource address', () => {
    expect(trivy.parseOutput(fixture('trivy-s3.json'))[0]).toMatchObject({
      toolId: 'trivy',
      ruleId: 'AWS-0086',
      resource: 'aws_s3_bucket.data',
    })
  })

  it('treats a clean scan as no findings, not a failure', () => {
    expect(trivy.parseOutput(fixture('trivy-no-findings.json'))).toEqual([])
  })

  it('fails loudly on output that is not a report', () => {
    expect(() => trivy.parseOutput('panic: something broke')).toThrow(UnreadableOutputError)
  })
})

describe('checkov adapter', () => {
  it('reads every failed check from real output', () => {
    expect(checkov.parseOutput(fixture('checkov-s3.json'))).toHaveLength(31)
  })

  it('names the rule and resource address', () => {
    expect(checkov.parseOutput(fixture('checkov-s3.json'))[0]).toMatchObject({
      toolId: 'checkov',
      ruleId: 'CKV_AWS_186',
      resource: 'aws_s3_bucket_object.data_object',
    })
  })

  it('treats its summary-only report as no findings', () => {
    expect(checkov.parseOutput(fixture('checkov-no-resources.json'))).toEqual([])
  })

  it('reports a file it could not parse as a failure, not as silence', () => {
    expect(() => checkov.parseOutput(fixture('checkov-broken.json'))).toThrow(UnreadableOutputError)
  })
})

describe('kics adapter', () => {
  it('reads one finding per affected location from real output', () => {
    const report = JSON.parse(fixture('kics-s3.json'))
    const expected = report.queries.reduce((total, query) => total + query.files.length, 0)
    expect(kics.parseOutput(fixture('kics-s3.json'))).toHaveLength(expected)
  })

  it('builds a resource address from the search key', () => {
    expect(kics.parseOutput(fixture('kics-s3.json'))[0]).toMatchObject({
      toolId: 'kics',
      ruleId: '5fb49a69-8d46-4495-a2f8-9c8c622b2b6e',
      resource: 'aws_s3_bucket_object.data_object',
    })
  })

  it('reads both search key styles the tool writes', () => {
    expect(resourceAddress('aws_s3_bucket[{{data}}].acl')).toBe('aws_s3_bucket.data')
    expect(resourceAddress('aws_security_group[web].ingress')).toBe('aws_security_group.web')
  })

  it('treats a parsed file with no results as no findings', () => {
    expect(kics.parseOutput(fixture('kics-no-findings.json'))).toEqual([])
  })

  it('reports a file it could not parse as a failure, not as silence', () => {
    expect(() => kics.parseOutput(fixture('kics-broken.json'))).toThrow(UnreadableOutputError)
  })
})
