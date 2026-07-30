using Demo.Data;
using Demo.Infrastructure;
using Demo.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;
using AuthEndpoints;
using AuthEndpoints.External.OAuth;
using AuthEndpoints.External.OAuth.GitHub;
using AuthEndpoints.External.OAuth.Google;
using AuthEndpoints.Identity;
using AuthEndpoints.ReAuth;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load();

builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDbContext<AppDbContext>(o =>
{
    o.UseSqlite(Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")!);
});

builder.Services
    .AddAuthEndpoints<AppUser, AppDbContext>(o =>
    {
        o.IdentityPath = "/auth/cookie";
        o.PasskeyPath = "/auth/passkey";
        o.Passkeys.ServerDomain = "localhost";
        o.RequireConfirmedAccount = false; // DEFAULT IS TRUE
        o.Jwt.Enabled = true;
        o.Jwt.Path = "/auth/jwt";
        o.Jwt.Configure = jwt =>
        {
            jwt.SigningOptions.SymmetricKey =
                Environment.GetEnvironmentVariable("JWT_SYMMETRIC_KEY")
                ?? "DemoOnly_ChangeMe_AuthEndpoints_Jwt_SigningKey_32+";
        };
    })
    .AddRoles<AppRole>()
    .AddEntityFrameworkStores<AppDbContext>();

builder.Services.Configure<AntiforgeryOptions>(o =>
{
    o.HeaderName = "RequestVerificationToken";
});

var githubClientId = Environment.GetEnvironmentVariable("GITHUB_CLIENT_ID");
var githubClientSecret = Environment.GetEnvironmentVariable("GITHUB_CLIENT_SECRET");
var googleClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
var googleClientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");

var externalAuth = builder.Services.AddExternalAuthEndpoints<AppUser>(o =>
{
    o.AllowedReturnUrlOrigins.Add("http://localhost:3000");
});

if (!string.IsNullOrEmpty(githubClientId) && !string.IsNullOrEmpty(githubClientSecret))
{
    externalAuth.AddGitHub(o =>
    {
        o.ClientId = githubClientId;
        o.ClientSecret = githubClientSecret;
    });
}

if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    externalAuth.AddGoogle(o =>
    {
        o.ClientId = googleClientId;
        o.ClientSecret = googleClientSecret;
    });
}

builder.Services.AddTransient<IEmailSender<AppUser>, ConsoleEmailSender>();

var frontendOrigin = Environment.GetEnvironmentVariable("FRONTEND_ORIGIN");
if (string.IsNullOrWhiteSpace(frontendOrigin))
{
    frontendOrigin = "http://localhost:3000";
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(frontendOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("Frontend");
app.UseAuthEndpoints();
app.UseMiddleware<AntiforgeryEnforcementMiddleware>();

app.MapAuthEndpoints<AppUser>();

var external = app.MapGroup("/auth/external").WithTags("External");
var mappedExternalProvider = false;
if (!string.IsNullOrEmpty(githubClientId) && !string.IsNullOrEmpty(githubClientSecret))
{
    external.MapGitHubAuthEndpoints<AppUser>();
    mappedExternalProvider = true;
}

if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    external.MapGoogleAuthEndpoints<AppUser>();
    mappedExternalProvider = true;
}

if (mappedExternalProvider)
{
    external.MapExternalAccountEndpoints<AppUser>();
}

app.MapPost("/test/csrf", () => Results.Ok()).EnableAntiforgery();
app.MapGet("/test/reauth", () => Results.Ok()).RequireReauth();

app.MapGet("createDefaultUser", async (UserManager<AppUser> userManager) =>
{
    var user = new AppUser()
    {
        UserName = "admin@authendpoints.id",
        Email = "admin@authendpoints.id"
    };

    await userManager.CreateAsync(user, "T3$ttest");

    return Results.Ok();
});

app.Run();
