import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { promises as fsPromise } from 'fs';
import handelbars from 'handlebars';
import {
  CreateMailDto,
  CredentialMailDTO,
  layoutFilDirename,
  mailTemplateDirectory,
  NotificationMailDTO,
} from './dto/create-mail.dto';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendMail(data: CreateMailDto<CredentialMailDTO>) {
    const UTF8 = 'utf-8';
    const templatesDir = join(__dirname, mailTemplateDirectory);

    const layoutPath = join(templatesDir, layoutFilDirename);
    const templatePath = join(templatesDir, `${data.template}.hbs`);
    const layoutData = await fsPromise.readFile(layoutPath, {
      encoding: UTF8,
    });
    const siblingTemplateData = await fsPromise.readFile(templatePath, {
      encoding: UTF8,
    });
    const compiledSiblingTemplate = this.compileHandlebarsTemplate(
      siblingTemplateData,
      data.context,
    );
    const compiledTemplate = this.compileHandlebarsTemplate(layoutData, {
      ...data,
      content: compiledSiblingTemplate,
    });

    this.mailerService
      .sendMail({
        to: data.email,
        subject: data.subject,
        html: compiledTemplate,
      })
      .then((res) => {
        console.log('mail envoyé');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  async sendNoticationForSignature(data: CreateMailDto<NotificationMailDTO>) {
    const UTF8 = 'utf-8';
    const templatesDir = join(__dirname, mailTemplateDirectory);

    const layoutPath = join(templatesDir, layoutFilDirename);
    const templatePath = join(templatesDir, `${data.template}.hbs`);
    const layoutData = await fsPromise.readFile(layoutPath, {
      encoding: UTF8,
    });
    const siblingTemplateData = await fsPromise.readFile(templatePath, {
      encoding: UTF8,
    });
    const compiledSiblingTemplate = this.compileHandlebarsTemplate(
      siblingTemplateData,
      data.context,
    );
    const compiledTemplate = this.compileHandlebarsTemplate(layoutData, {
      ...data,
      content: compiledSiblingTemplate,
    });

    this.mailerService
      .sendMail({
        to: data.email,
        subject: data.subject,
        html: compiledTemplate,
      })
      .then((res) => {
        console.log('mail envoyé');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  private compileHandlebarsTemplate(templateContent: string, context: any) {
    const template = handelbars.compile(templateContent);
    const compiledTemplate = template(context);
    return compiledTemplate;
  }
}
